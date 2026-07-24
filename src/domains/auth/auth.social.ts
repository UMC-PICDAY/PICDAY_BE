import { AppError } from "../../common/error.js";
import type { Provider } from "../../generated/prisma/client.js";

// 명세서: provider = kakao | google (카카오·구글 2종, 요청/응답 구조 동일)
export const SOCIAL_PROVIDERS = ["kakao", "google"] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

/**
 * path의 provider 문자열을 kakao|google인지 확인하는 로직.
 * 지원하지 않는 provider는 잘못된 요청으로 간주(COMMON_400).
 */
export function assertSocialProvider(value: string): SocialProvider {
  if ((SOCIAL_PROVIDERS as readonly string[]).includes(value)) {
    return value as SocialProvider;
  }
  throw new AppError("COMMON_400");
}

// 소셜에서 수집한 정규화된 유저 정보 (provider 공통 형태)
export type SocialInfo = {
  provider: Provider;
  providerId: string;
  email: string | null;
  name: string | null;
  phoneNumber: string | null;
};

type ProviderOAuthConfig = {
  // DB Provider enum (KAKAO | GOOGLE)
  provider: Provider;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  clientId: string;
  // 카카오는 선택(콘솔에서 client_secret 미사용 가능), 구글은 필수
  clientSecret: string | undefined;
  redirectUri: string;
  // OAuth scope. 비어 있으면 authUrl에서 생략(소셜 콘솔의 필수 동의 항목 설정에 위임).
  scope: string;
};

/**
 * 소셜 OAuth 관련 환경변수를 읽는다.
 * 미설정은 서버 구성 오류이므로 소셜 서버 오류(AUTH_5021)로 수렴시킨다.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new AppError("AUTH_5021");
  }
  return value;
}

function getProviderOAuthConfig(provider: SocialProvider): ProviderOAuthConfig {
  switch (provider) {
    case "kakao":
      return {
        provider: "KAKAO",
        authorizeUrl: "https://kauth.kakao.com/oauth/authorize",
        tokenUrl: "https://kauth.kakao.com/oauth/token",
        userInfoUrl: "https://kapi.kakao.com/v2/user/me",
        clientId: requireEnv("KAKAO_CLIENT_ID"),
        clientSecret: process.env.KAKAO_CLIENT_SECRET || undefined,
        redirectUri: requireEnv("KAKAO_REDIRECT_URI"),
        // 이름·전화번호·이메일 동의 항목은 카카오 콘솔 설정 + scope로 요청
        scope: process.env.KAKAO_SCOPE ?? "",
      };
    case "google":
      return {
        provider: "GOOGLE",
        authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
        clientId: requireEnv("GOOGLE_CLIENT_ID"),
        clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
        redirectUri: requireEnv("GOOGLE_REDIRECT_URI"),
        scope: process.env.GOOGLE_SCOPE ?? "openid email profile",
      };
  }
}

/**
 * 소셜 인증 페이지로 보낼 authorize URL을 생성한다.
 */
export function buildSocialAuthUrl(provider: SocialProvider): string {
  const config = getProviderOAuthConfig(provider);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
  });
  if (config.scope) {
    params.set("scope", config.scope);
  }

  return `${config.authorizeUrl}?${params.toString()}`;
}

/**
 * 인가 코드를 access token으로 교환한다.
 * - redirect_uri 불일치 → AUTH_4001
 * - 인가 코드 무효/만료 → AUTH_4011
 * - 그 외(네트워크·소셜 서버 오류) → AUTH_5021
 */
async function requestAccessToken(
  config: ProviderOAuthConfig,
  code: string,
  redirectUri: string,
): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    redirect_uri: redirectUri,
    code,
  });
  if (config.clientSecret) {
    body.set("client_secret", config.clientSecret);
  }

  let response: Response;
  try {
    response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    // 네트워크 오류 등
    throw new AppError("AUTH_5021");
  }

  const data = (await response.json().catch(() => null)) as
    | { access_token?: string; error?: string }
    | null;

  if (!response.ok || !data?.access_token) {
    if (data?.error === "redirect_uri_mismatch") {
      throw new AppError("AUTH_4001");
    }
    // invalid_grant(구글) / 400·401(카카오 KOE320 등) = 인가 코드 무효·만료
    if (
      data?.error === "invalid_grant" ||
      response.status === 400 ||
      response.status === 401
    ) {
      throw new AppError("AUTH_4011");
    }
    throw new AppError("AUTH_5021");
  }

  return data.access_token;
}

/** access token으로 소셜 유저 정보 원본(JSON)을 가져온다. */
async function requestUserInfo(
  config: ProviderOAuthConfig,
  accessToken: string,
): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(config.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new AppError("AUTH_5021");
  }

  if (!response.ok) {
    throw new AppError("AUTH_5021");
  }

  const data = (await response.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!data) {
    throw new AppError("AUTH_5021");
  }
  return data;
}

/**
 * 한국 휴대폰 번호 정규화: "+82 10-1234-5678" → "01012345678".
 * 값이 없으면 null.
 */
function normalizeKoreanPhone(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.trim() === "") {
    return null;
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("82")) {
    return `0${digits.slice(2)}`;
  }
  return digits === "" ? null : digits;
}

function toKakaoSocialInfo(raw: Record<string, unknown>): SocialInfo {
  const account = (raw.kakao_account ?? {}) as Record<string, unknown>;
  const profile = (account.profile ?? {}) as Record<string, unknown>;

  return {
    provider: "KAKAO",
    providerId: String(raw.id ?? ""),
    // 이메일 미제공/빈 문자열은 null 유지: email은 UNIQUE 컬럼이라 ""로 저장하면
    // 이메일 없는 회원이 2명 이상일 때 unique 충돌이 발생한다(NULL은 중복 허용).
    // 이를 방지하기 위한 로직 구현: 이메일 미제공/빈 문자열은 null 유지.
    email:
      typeof account.email === "string" && account.email.trim() !== ""
        ? account.email
        : null,
    name:
      (typeof account.name === "string" && account.name) ||
      (typeof profile.nickname === "string" && profile.nickname) ||
      null,
    phoneNumber: normalizeKoreanPhone(account.phone_number),
  };
}

function toGoogleSocialInfo(raw: Record<string, unknown>): SocialInfo {
  return {
    provider: "GOOGLE",
    providerId: String(raw.id ?? ""),
    // 이메일 미제공/빈 문자열은 null 유지(UNIQUE 충돌 방지, KAKAO와 동일)
    email:
      typeof raw.email === "string" && raw.email.trim() !== ""
        ? raw.email
        : null,
    name: typeof raw.name === "string" ? raw.name : null,
    // 구글은 기본 scope로 전화번호를 제공하지 않음
    phoneNumber: null,
  };
}

/**
 * 인가 코드 → access token → 유저 정보 조회까지 수행해 정규화된 SocialInfo를 반환한다.
 * redirectUri는 인가 요청 때 쓴 값과 동일해야 하며, 서버 설정과 다르면 AUTH_4001.
 */
export async function getSocialProfile(
  provider: SocialProvider,
  authorizationCode: string,
  redirectUri: string,
): Promise<SocialInfo> {
  const config = getProviderOAuthConfig(provider);

  // 요청한 redirectUri가 서버에 등록된 값과 다르면 위조/오설정 → AUTH_4001
  if (redirectUri !== config.redirectUri) {
    throw new AppError("AUTH_4001");
  }

  const accessToken = await requestAccessToken(config, authorizationCode, redirectUri);
  const raw = await requestUserInfo(config, accessToken);

  return config.provider === "KAKAO"
    ? toKakaoSocialInfo(raw)
    : toGoogleSocialInfo(raw);
}
