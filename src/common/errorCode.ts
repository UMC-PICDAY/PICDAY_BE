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

  // Auth
  AUTH_4001: {
    status: 400,
    code: "AUTH_4001",
    message: "Redirect URI가 일치하지 않습니다.",
  },
  AUTH_4003: {
    status: 400,
    code: "AUTH_4003",
    message: "2~10자의 한글·영문·숫자만 사용 가능해요.",
  },
  AUTH_4004: {
    status: 400,
    code: "AUTH_4004",
    message: "올바른 이메일 형식이 아니에요.",
  },
  AUTH_4005: {
    status: 400,
    code: "AUTH_4005",
    message:
      "비밀번호가 올바른 형식이 아닙니다. 8~20자 사이, 영문+숫자+특수문자 필수 조합사항입니다.",
  },
  AUTH_4006: {
    status: 400,
    code: "AUTH_4006",
    message:
      "대문자, 공백, 특수문자가 포함되었거나, 숫자로 시작 또는 숫자로만 이루어진 아이디는 사용할 수 없습니다.",
  },
  AUTH_4007: {
    status: 400,
    code: "AUTH_4007",
    message: "올바른 휴대폰 번호를 입력해 주세요. (숫자만 입력)",
  },
  AUTH_4011: {
    status: 401,
    code: "AUTH_4011",
    message: "유효하지 않은 인증 코드입니다.",
  },
  AUTH_4013: {
    status: 401,
    code: "AUTH_4013",
    message: "유효하지 않은 토큰입니다.",
  },
  AUTH_4014: {
    status: 401,
    code: "AUTH_4014",
    message: "회원가입 시간이 만료되었습니다. 다시 로그인해 주세요.",
  },
  AUTH_4015: {
    status: 401,
    code: "AUTH_4015",
    message: "아이디 또는 비밀번호를 확인해 주세요.",
  },
  AUTH_4016: {
    status: 401,
    code: "AUTH_4016",
    message: "세션이 만료되었습니다. 다시 로그인해 주세요.",
  },
  AUTH_4017: {
    status: 401,
    code: "AUTH_4017",
    message: "인증이 만료되었습니다. 토큰을 갱신해 주세요.",
  },
  AUTH_4091: {
    status: 409,
    code: "AUTH_4091",
    message: "이미 사용 중인 닉네임이에요.",
  },
  AUTH_4092: {
    status: 409,
    code: "AUTH_4092",
    message: "이미 가입된 이메일입니다.",
  },
  AUTH_4093: {
    status: 409,
    code: "AUTH_4093",
    message: "이미 사용 중인 아이디예요.",
  },
  AUTH_4094: {
    status: 409,
    code: "AUTH_4094",
    message: "진행 중인 예약이 있어 탈퇴할 수 없어요.",
  },
  AUTH_5021: {
    status: 500,
    code: "AUTH_5021",
    message: "소셜 로그인 서버 오류가 발생했습니다.",
  },
} as const;

export type ErrorCodeType = keyof typeof ErrorCode;