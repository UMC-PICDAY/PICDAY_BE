export const ErrorCode = {
  // Common
  COMMON_400: {
    status: 400,
    code: "COMMON_400",
    message: "요청이 올바르지 않습니다.",
  },
  COMMON_401: {
    status: 401,
    code: "COMMON_401",
    message: "인증이 필요합니다.",
  },
  COMMON_403: {
    status: 403,
    code: "COMMON_403",
    message: "접근 권한이 없습니다.",
  },
  COMMON_404: {
    status: 404,
    code: "COMMON_404",
    message: "대상을 찾을 수 없습니다.",
  },
  COMMON_409: {
    status: 409,
    code: "COMMON_409",
    message: "요청이 충돌했습니다.",
  },
  COMMON_500: {
    status: 500,
    code: "COMMON_500",
    message: "서버 오류가 발생했습니다.",
  },

  // Reservation
  RESERVATION_4001: {
    status: 400,
    code: "RESERVATION_4001",
    message: "이름과 연락처를 입력해 주세요.",
  },
  RESERVATION_4002: {
    status: 400,
    code: "RESERVATION_4002",
    message: "촬영 당일은 취소가 불가합니다.",
  },
  RESERVATION_4003: {
    status: 400,
    code: "RESERVATION_4003",
    message: "유효하지 않은 예약 상태값입니다.",
  },
  RESERVATION_4004: {
    status: 400,
    code: "RESERVATION_4004",
    message: "지난 시간대는 예약할 수 없어요.",
  },
  RESERVATION_4041: {
    status: 404,
    code: "RESERVATION_4041",
    message: "존재하지 않는 예약입니다.",
  },
  RESERVATION_4042: {
    status: 404,
    code: "RESERVATION_4042",
    message: "해당 예약 내역을 찾을 수 없거나 접근 권한이 없습니다.",
  },
  RESERVATION_4091: {
    status: 409,
    code: "RESERVATION_4091",
    message: "이미 예약된 시간대예요.",
  },
  RESERVATION_4092: {
    status: 409,
    code: "RESERVATION_4092",
    message: "이미 취소된 예약입니다.",
  },
  RESERVATION_4093: {
    status: 409,
    code: "RESERVATION_4093",
    message: "이미 완료된 촬영은 취소할 수 없어요.",
  },
  RESERVATION_5001: {
    status: 500,
    code: "RESERVATION_5001",
    message: "예약 처리 중 오류가 발생했어요.",
  },
} as const;

export type ErrorCodeType = keyof typeof ErrorCode;