import jwt from "jsonwebtoken";
// 현재 JWT 발급 주체가 auth 서비스이므로, 도메인이 소유하도록 구현
// 추후에 필요시 common 폴더로 옮겨도 됨.


// 팀 확정 스펙: Access 1시간, Refresh 14일 (초 단위)
export const ACCESS_TOKEN_EXPIRES_IN = 3600;
export const REFRESH_TOKEN_EXPIRES_IN = 1209600;

type TokenType = "access" | "refresh";

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
