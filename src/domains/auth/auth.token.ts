import jwt from "jsonwebtoken";
import { AppError } from "../../common/error.js";
import type { ErrorCodeType } from "../../common/errorCode.js";
import type { Provider } from "../../generated/prisma/client.js";
// 현재 JWT 발급 주체가 auth 서비스이므로, 도메인이 소유하도록 구현
// 추후에 필요시 common 폴더로 옮겨도 됨.


// 팀 확정 스펙: Access 1시간, Refresh 14일 (초 단위)
export const ACCESS_TOKEN_EXPIRES_IN = 3600;
export const REFRESH_TOKEN_EXPIRES_IN = 1209600;
// Signup Token: 소셜 신규 유저의 회원가입 완료용 임시 토큰 (10분)
export const SIGNUP_TOKEN_EXPIRES_IN = 600;

export type TokenType = "access" | "refresh" | "signup";

export type TokenPayload = {
  sub: string; // user.id (BigInt → string)
  type: TokenType;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET 환경변수가 설정되지 않았습니다.");
  }
  return secret;
}

export function signAccessToken(userId: string): string {
  const payload: TokenPayload = { sub: userId, type: "access" };
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

export function signRefreshToken(userId: string): string {
  const payload: TokenPayload = { sub: userId, type: "refresh" };
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

/**
 * 소셜 회원가입용 Signup Token payload.
 * 신규 소셜 유저는 아직 user.id가 없으므로, 회원가입 완료(3번)에 필요한 소셜 정보를
 * 토큰에 담아 전달한다. (10분 단기 토큰, 클라이언트는 이미 이 정보를 알고 있음)
 */
export type SignupTokenPayload = {
  type: "signup";
  provider: Provider;
  providerId: string;
  email: string | null;
  name: string | null;
  phoneNumber: string | null;
};

export type SocialSignupClaims = Omit<SignupTokenPayload, "type">;

export function signSocialSignupToken(claims: SocialSignupClaims): string {
  const payload: SignupTokenPayload = { type: "signup", ...claims };
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: SIGNUP_TOKEN_EXPIRES_IN,
  });
}

/**
 * 소셜 Signup Token 검증. (소셜 회원가입 완료 3번에서 사용)
 * - 서명 불일치·형식 오류·타입 불일치 → AUTH_4013
 * - 만료 → AUTH_4014
 */
export function verifySocialSignupToken(token: string): SignupTokenPayload {
  let decoded: unknown;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError("AUTH_4014");
    }
    throw new AppError("AUTH_4013");
  }

  const payload = decoded as Partial<SignupTokenPayload>;
  if (
    payload?.type !== "signup" ||
    typeof payload.providerId !== "string" ||
    (payload.provider !== "KAKAO" && payload.provider !== "GOOGLE")
  ) {
    throw new AppError("AUTH_4013");
  }

  return {
    type: "signup",
    provider: payload.provider,
    providerId: payload.providerId,
    email:
      typeof payload.email === "string" && payload.email.trim() !== ""
        ? payload.email
        : null,
    name: payload.name ?? null,
    phoneNumber: payload.phoneNumber ?? null,
  };
}

/**
 * `Authorization: Bearer <token>` 헤더에서 토큰만 추출.
 * 형식이 아니거나 값이 비어 있으면 null.
 */
export function extractBearerToken(header?: string): string | null {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

// 만료 시 토큰 타입별로 명세서의 에러 코드가 다름
// (access → AUTH_4017, refresh → AUTH_4016, signup → AUTH_4014)
const EXPIRED_ERROR_CODE: Record<TokenType, ErrorCodeType> = {
  access: "AUTH_4017",
  refresh: "AUTH_4016",
  signup: "AUTH_4014",
};

/**
 * JWT 서명·만료를 검증하고 payload를 반환.
 * - 서명 불일치·형식 오류·타입 불일치 → AUTH_4013
 * - 만료 → 토큰 타입별 코드 (위 EXPIRED_ERROR_CODE)
 *
 * MVP 결정: DB 상태(탈퇴 여부 등) 조회 없이 JWT 검증만 수행.
 * Access 1시간 단기 + Refresh 회전으로 리스크 완화.
 */
export function verifyToken(token: string, expectedType: TokenType): TokenPayload {
  let decoded: unknown;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(EXPIRED_ERROR_CODE[expectedType]);
    }
    throw new AppError("AUTH_4013");
  }

  const payload = decoded as Partial<TokenPayload>;
  if (typeof payload?.sub !== "string" || payload.type !== expectedType) {
    throw new AppError("AUTH_4013");
  }
  return { sub: payload.sub, type: payload.type };
}
