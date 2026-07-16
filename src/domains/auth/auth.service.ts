import bcrypt from "bcrypt";
import { AppError } from "../../common/error.js";
import * as authRepository from "./auth.repository.js";
import type { LoginRequestDto, SignupRequestDto } from "./auth.dto.js";
import {
  NICKNAME_ADJECTIVES,
  NICKNAME_NOUNS,
} from "./auth.nickname.constants.js";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  signAccessToken,
  signRefreshToken,
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

export async function register(dto: SignupRequestDto) {
  const existingLoginId = await authRepository.findUserByLoginId(dto.loginId);
  if (existingLoginId) {
    throw new AppError("AUTH_4093");
  }

  const existingEmail = await authRepository.findUserByEmail(dto.email);
  if (existingEmail) {
    throw new AppError("AUTH_4092");
  }

  const hashedPassword = await bcrypt.hash(dto.password, 10);
  const nickname = await generateUniqueNickname();

  // TODO: agreedTermsIds(dto.agreedTermsIds)를 UserTerms로 저장하는 로직 추가
  const user = await authRepository.createUser({
    loginId: dto.loginId,
    password: hashedPassword,
    name: dto.name,
    nickname,
    email: dto.email,
    phoneNumber: dto.phoneNumber,
  });

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

  const userId = user.id.toString();
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);

  await authRepository.updateRefreshToken(user.id, refreshToken);

  return {
    user: {
      id: userId,
      loginId: user.loginId,
      nickname: user.nickname,
      provider: user.provider,
    },
    token: {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: ACCESS_TOKEN_EXPIRES_IN,
      refreshTokenExpiresIn: REFRESH_TOKEN_EXPIRES_IN,
    },
  };
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
