import { AppError } from "../../common/error.js";

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

type ProviderOAuthConfig = {
  authorizeUrl: string;
  clientId: string;
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
        authorizeUrl: "https://kauth.kakao.com/oauth/authorize",
        clientId: requireEnv("KAKAO_CLIENT_ID"),
        redirectUri: requireEnv("KAKAO_REDIRECT_URI"),
        // 이름·전화번호·이메일 동의 항목은 카카오 콘솔 설정 + scope로 요청
        scope: process.env.KAKAO_SCOPE ?? "",
      };
    case "google":
      return {
        authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        clientId: requireEnv("GOOGLE_CLIENT_ID"),
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
