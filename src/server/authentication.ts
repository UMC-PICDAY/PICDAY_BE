import type { Request } from "express";
import { AppError } from "../common/error.js";
import {
  extractBearerToken,
  verifyToken,
  type TokenType,
} from "../domains/auth/auth.token.js";

// tsoa @Security(securityName) → 요구 토큰 타입 매핑
// - jwt: Access Token (일반 인증 API)
// - refresh: Refresh Token (토큰 재발급)
// - signup: Signup Token (소셜 회원가입 완료)
const SECURITY_TO_TOKEN_TYPE: Record<string, TokenType> = {
  jwt: "access",
  refresh: "refresh",
  signup: "signup",
};

export type AuthenticatedUser = { userId: bigint };

/**
 * tsoa 인증 훅. @Security()가 붙은 라우트 진입 시 자동 호출된다.
 * Authorization: Bearer 헤더를 파싱·검증하고 request.userId를 채운다.
 * (wishlist/reservation 등 컨트롤러는 request.userId 계약에 의존)
 */
export async function expressAuthentication(
  request: Request,
  securityName: string,
  _scopes?: string[],
): Promise<AuthenticatedUser> {
  const tokenType = SECURITY_TO_TOKEN_TYPE[securityName];
  if (!tokenType) {
    // 컨트롤러에 정의되지 않은 securityName을 쓴 경우 — 설정 오류
    throw new AppError("COMMON_500");
  }

  const token = extractBearerToken(request.headers.authorization);
  if (!token) {
    throw new AppError("AUTH_4013");
  }

  const payload = verifyToken(token, tokenType);

  let userId: bigint;
  try {
    userId = BigInt(payload.sub);
  } catch {
    throw new AppError("AUTH_4013");
  }

  (request as Request & AuthenticatedUser).userId = userId;
  return { userId };
}
