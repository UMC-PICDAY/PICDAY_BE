import bcrypt from "bcrypt";
import { AppError } from "../../common/error.js";
import * as authRepository from "./auth.repository.js";
import { buildSocialAuthUrl, type SocialProvider } from "./auth.social.js";
import { 
  type LoginRequestDto,
  type SignupRequestDto,
  type GetMeResponseDto,
  type UpdateNicknameRequestDto,
  type UpdateNicknameResponseDto,
  getMeResponseSchema,
  updateNicknameResponseSchema
} from "./auth.dto.js";
import {
  NICKNAME_ADJECTIVES,
  NICKNAME_NOUNS,
} from "./auth.nickname.constants.js";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from "./auth.token.js";

// 영문 소문자 시작, 영문 소문자+숫자, 4~12자 (signup 규칙과 동일)
const LOGIN_ID_REGEX = /^[a-z][a-z0-9]{3,11}$/;
// 2~10자 한글·영문·숫자 (특수문자·공백 불가)
const NICKNAME_REGEX = /^[가-힣A-Za-z0-9]{2,10}$/;

function pickRandom<T extends readonly string[]>(items: T): T[number] {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomFourDigits(): string {
  return String(Math.floor(Math.random() * 10_000)).padStart(4, "0");
}

async function generateUniqueNickname(): Promise<string> {
  const adjective = pickRandom(NICKNAME_ADJECTIVES);
  const noun = pickRandom(NICKNAME_NOUNS);
  let nickname = `${adjective}${noun}${randomFourDigits()}`;

  while (await authRepository.findUserByNickname(nickname)) {
    nickname = `${adjective}${noun}${randomFourDigits()}`;
  }

  return nickname;
}

/**
 * Access/Refresh 토큰을 새로 발급하고 refreshToken을 DB에 저장한다.
 * 로그인·토큰 갱신 모두 이 경로를 거치므로, 갱신 시 이전 refreshToken은 덮어써져 무효화된다(Refresh 회전).
 */
async function issueTokenPair(userId: bigint) {
  const sub = userId.toString();
  const accessToken = signAccessToken(sub);
  const refreshToken = signRefreshToken(sub);

  await authRepository.updateRefreshToken(userId, refreshToken);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenExpiresIn: REFRESH_TOKEN_EXPIRES_IN,
  };
}

/**
 * 소셜 인증 URL 생성.
 * provider(kakao|google)별 authorize URL을 만들어 반환한다.
 */
export function getSocialAuthUrl(provider: SocialProvider) {
  return { authUrl: buildSocialAuthUrl(provider) };
}

/**
 * 약관 동의 검증. (자체 회원가입·소셜 회원가입 완료가 공유)
 * - 필수 약관(isRequired=true)이 모두 동의 목록에 포함되어야 한다.
 * - 존재하지 않는 약관 ID가 섞여 있으면 안 된다.
 * 위반 시 AUTH_4008.
 */
export async function assertTermsAgreed(agreedTermIds: bigint[]): Promise<void> {
  const [requiredTermIds, existingTermIds] = await Promise.all([
    authRepository.findRequiredTermIds(),
    authRepository.findExistingTermIds(agreedTermIds),
  ]);

  const agreedSet = new Set(agreedTermIds);
  const existingSet = new Set(existingTermIds);

  const missingRequired = requiredTermIds.filter((id) => !agreedSet.has(id));
  const unknownAgreed = agreedTermIds.filter((id) => !existingSet.has(id));

  if (missingRequired.length > 0 || unknownAgreed.length > 0) {
    throw new AppError("AUTH_4008");
  }
}

export async function register(dto: SignupRequestDto) {
  const existingLoginId = await authRepository.findUserByLoginId(dto.loginId);
  if (existingLoginId) {
    throw new AppError("AUTH_4093");
  }

  const existingEmail = await authRepository.findUserByEmail(dto.email);
  if (existingEmail) {
    throw new AppError("AUTH_4092");
  }

  // 필수 약관 동의 여부를 유저 생성 전에 먼저 검증 (실패 시 빠르게 중단)
  const agreedTermIds = dto.agreedTermsIds.map((id) => BigInt(id));
  await assertTermsAgreed(agreedTermIds);

  const hashedPassword = await bcrypt.hash(dto.password, 10);
  const nickname = await generateUniqueNickname();

  const user = await authRepository.createUserWithTerms(
    {
      loginId: dto.loginId,
      password: hashedPassword,
      name: dto.name,
      nickname,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
    },
    agreedTermIds,
  );

  const { password: _password, ...userWithoutPassword } = user;

  return {
    ...userWithoutPassword,
    id: user.id.toString(),
  };
}

export async function login(dto: LoginRequestDto) {
  const loginId = dto.loginId.toLowerCase();

  // 유저 없음/비밀번호 불일치를 구분하지 않음 → 계정 존재 여부 노출 방지
  const user = await authRepository.findActiveLocalUserByLoginId(loginId);
  if (!user || !user.password) {
    throw new AppError("AUTH_4015");
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.password);
  if (!isPasswordValid) {
    throw new AppError("AUTH_4015");
  }

  const token = await issueTokenPair(user.id);

  return {
    user: {
      id: user.id.toString(),
      loginId: user.loginId,
      nickname: user.nickname,
      provider: user.provider,
    },
    token,
  };
}

/**
 * Refresh Token으로 Access/Refresh를 재발급한다 (Refresh 회전).
 *
 * userId는 @Security("refresh")를 통과한 Authorization 헤더에서 나온 값이고,
 * refreshToken은 실제 대조 대상이 되는 원본 토큰 문자열이다.
 */
export async function refresh(userId: bigint, refreshToken: string) {
  // 서명·만료·타입 검증 (만료 → AUTH_4016, 그 외 → AUTH_4013)
  const payload = verifyToken(refreshToken, "refresh");

  // 토큰 주인과 인증된 유저가 다르면 위조 시도
  if (payload.sub !== userId.toString()) {
    throw new AppError("AUTH_4013");
  }

  const user = await authRepository.findUserById(userId);
  if (!user || user.status !== "ACTIVE") {
    throw new AppError("AUTH_4013");
  }

  // DB 값과 불일치 = 이미 회전되어 폐기된 토큰의 재사용 또는 로그아웃된 세션 → 탈취 의심
  if (!user.refreshToken || user.refreshToken !== refreshToken) {
    throw new AppError("AUTH_4013");
  }

  const token = await issueTokenPair(user.id);

  return { token };
}

export async function checkLoginIdAvailability(rawLoginId: string) {
  const loginId = rawLoginId.toLowerCase();
  if (!LOGIN_ID_REGEX.test(loginId)) {
    throw new AppError("AUTH_4006");
  }

  const existing = await authRepository.findUserByLoginId(loginId);
  return { available: !existing };
}

export async function checkNicknameAvailability(nickname: string) {
  if (!NICKNAME_REGEX.test(nickname)) {
    throw new AppError("AUTH_4003");
  }

  const existing = await authRepository.findUserByNickname(nickname);
  return { available: !existing };
}

export async function getMe(
  userId: bigint
): Promise<GetMeResponseDto> {
  const user = await authRepository.getUserById(userId);

  if (!user){
    throw new AppError("COMMON_404");
  }

  return getMeResponseSchema.parse({
    user: {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      email: user.email,
      // profileImageUrl: user.profileImageUrl,
      provider: user.provider,
      // notification: {
      //   reservation: user.notificationReservation,
      //   marketing: user.notificationMarketing,
      // },
    },
  });
}

export async function updateNickname(
  userId: bigint,
  dto: UpdateNicknameRequestDto
): Promise<UpdateNicknameResponseDto> {
  const duplicated = await authRepository.getUserByNickname(dto.nickname);
  if (duplicated) {
    throw new AppError("AUTH_4091");
  }

  const user = await authRepository.updateNickname(userId, dto.nickname);

  return updateNicknameResponseSchema.parse({
    user: {
      id: user.id,
      nickname: user.nickname
    }
  });
}