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
  code: string = "COMMON_200",
): ApiResponse<T> {
  return {
    success: true,
    code,
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

// 컨트롤러가 커스텀 성공 메시지를 지정할 때 쓰는 내부 헤더 이름.
// 최종 응답에는 노출되지 않고 responseWrapper가 읽은 뒤 제거함.
export const SUCCESS_MESSAGE_HEADER = "x-success-message";

// tsoa 컨트롤러에서 커스텀 메시지가 필요할 때 사용
// 예: setSuccessMessage(this, "예약이 성공적으로 완료되었습니다.");
export function setSuccessMessage(
  controller: { setHeader: (name: string, value: string) => void },
  message: string,
): void {
  // 헤더 값은 ASCII만 안전하므로 한글 메시지는 인코딩해서 보관
  controller.setHeader(SUCCESS_MESSAGE_HEADER, encodeURIComponent(message));
}
