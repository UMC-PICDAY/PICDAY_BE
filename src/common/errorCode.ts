export const ErrorCode = {
  INVALID_INPUT: { status: 400, code: "COMMON_400", message: "잘못된 요청입니다." },
  UNAUTHORIZED: { status: 401, code: "COMMON_401", message: "인증이 필요합니다." },
  NOT_FOUND: { status: 404, code: "COMMON_404", message: "리소스를 찾을 수 없습니다." },
  INTERNAL_ERROR: { status: 500, code: "COMMON_500", message: "서버 오류가 발생했습니다." },
} as const;

export type ErrorCodeType = keyof typeof ErrorCode; // → "INVALID_INPUT" | "NOT_FOUND"
