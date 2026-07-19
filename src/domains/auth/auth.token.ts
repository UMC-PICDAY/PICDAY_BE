import jwt from "jsonwebtoken";
import { AppError } from "../../common/error.js";
import type { ErrorCodeType } from "../../common/errorCode.js";
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

export function signSignupToken(userId: string): string {
  const payload: TokenPayload = { sub: userId, type: "signup" };
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: SIGNUP_TOKEN_EXPIRES_IN,
  });
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
