export type ApiResponse<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T | null;
};

// 성공 응답
export function success<T>(
  data: T,
  message: string = "요청에 성공했습니다.",
): ApiResponse<T> {
  return {
    success: true,
    code: "COMMON_200",
    message,
    data,
  };
}

// 에러 응답
export function fail(code: string, message: string): ApiResponse<null> {
  return {
    success: false,
    code,
    message,
    data: null,
  };
}
