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
  RESERVATION_4005: {
    status: 400,
    code: "RESERVATION_4005",
    message: "예약 생성 요청 형식 또는 입력값이 올바르지 않습니다.",
  },
  RESERVATION_4006: {
    status: 400,
    code: "RESERVATION_4006",
    message: "사진관, 상품, 슬롯의 소속 관계가 일치하지 않습니다.",
  },
  RESERVATION_4007: {
    status: 400,
    code: "RESERVATION_4007",
    message: "필수 약관 동의가 누락되었습니다.",
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
  RESERVATION_4043: {
    status: 404,
    code: "RESERVATION_4043",
    message: "사진관, 상품 또는 슬롯을 찾을 수 없습니다.",
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

  // Studio
  STUDIO_4001: {
    status: 400,
    code: "STUDIO_4001",
    message: "사진관 API 요청 형식 또는 입력값이 올바르지 않습니다.",
  },
  STUDIO_4002: {
    status: 400,
    code: "STUDIO_4002",
    message: "과거 날짜의 예약 가능 시간은 조회할 수 없습니다.",
  },
  STUDIO_4003: {
    status: 400,
    code: "STUDIO_4003",
    message: "잘못된 필터 조건입니다.",
  },
  STUDIO_4004: {
    status: 400,
    code: "STUDIO_4004",
    message: "날짜 형식이 올바르지 않습니다.",
  },
  STUDIO_4005: {
    status: 400,
    code: "STUDIO_4005",
    message: "시간 형식이 올바르지 않습니다.",
  },
  STUDIO_4006: {
    status: 400,
    code: "STUDIO_4006",
    message: "올바르지 않은 상품 ID입니다.",
  },
  STUDIO_4007: {
    status: 400,
    code: "STUDIO_4007",
    message: "올바르지 않은 촬영 컨셉입니다.",
  },
  STUDIO_4008: {
    status: 400,
    code: "STUDIO_4008",
    message: "올바르지 않은 지역입니다.",
  },
  STUDIO_4009: {
    status: 400,
    code: "STUDIO_4009",
    message: "올바르지 않은 서비스 태그입니다.",
  },
  STUDIO_40011: {
    status: 400,
    code: "STUDIO_40011",
    message: "올바르지 않은 사진관 ID입니다.",
  },
  STUDIO_40012: {
    status: 400,
    code: "STUDIO_40012",
    message:
      "검색 조건은 location, date, concept, name 중 최소 1개 이상 필요합니다.",
  },
  STUDIO_40013: {
    status: 400,
    code: "STUDIO_40013",
    message: "비교할 사진관 목록이 올바르지 않습니다.",
  },
  STUDIO_40014: {
    status: 400,
    code: "STUDIO_40014",
    message: "올바르지 않은 정렬 기준입니다.",
  },
  STUDIO_40015: {
    status: 400,
    code: "STUDIO_40015",
    message: "해당 시간 슬롯은 요청한 사진관에 속하지 않습니다.",
  },
  STUDIO_4041: {
    status: 404,
    code: "STUDIO_4041",
    message: "존재하지 않는 사진관입니다.",
  },
  STUDIO_4043: {
    status: 404,
    code: "STUDIO_4043",
    message: "존재하지 않는 상품입니다.",
  },
  STUDIO_4044: {
    status: 404,
    code: "STUDIO_4044",
    message: "해당 사진관의 상품을 찾을 수 없습니다.",
  },
  STUDIO_4045: {
    status: 404,
    code: "STUDIO_4045",
    message: "존재하지 않는 시간 슬롯입니다.",
  },
  STUDIO_5001: {
    status: 500,
    code: "STUDIO_5001",
    message: "예약 가능 시간 조회 중 오류가 발생했습니다.",
  },

  // Wishlist
  WISHLIST_4001: {
    status: 400,
    code: "WISHLIST_4001",
    message: "page/size 형식이 올바르지 않습니다.",
  },
  WISHLIST_4002: {
    status: 400,
    code: "WISHLIST_4002",
    message: "studioId가 올바르지 않습니다.",
  },
  WISHLIST_4041: {
    status: 404,
    code: "WISHLIST_4041",
    message: "존재하지 않는 사진관입니다.",
  },
  WISHLIST_4042: {
    status: 404,
    code: "WISHLIST_4042",
    message: "위시리스트에 없는 사진관입니다.",
  },
  WISHLIST_4091: {
    status: 409,
    code: "WISHLIST_4091",
    message: "이미 위시리스트에 추가된 사진관입니다.",
  },
  WISHLIST_5001: {
    status: 500,
    code: "WISHLIST_5001",
    message: "위시리스트 처리 중 오류가 발생했어요.",
  },

  // Review (이미지 업로드 관련 IMAGE 코드는 업로드 API 구현 시 추가)
  REVIEW_4001: {
    status: 400,
    code: "REVIEW_4001",
    message: "rating은 1~5 사이여야 합니다.",
  },
  REVIEW_4002: {
    status: 400,
    code: "REVIEW_4002",
    message: "content는 10~500자여야 합니다.",
  },
  REVIEW_4003: {
    status: 400,
    code: "REVIEW_4003",
    message: "이미지는 최대 5개까지 가능합니다.",
  },
  REVIEW_4004: {
    status: 400,
    code: "REVIEW_4004",
    message: "완료된 예약만 리뷰 작성이 가능합니다.",
  },
  REVIEW_4005: {
    status: 400,
    code: "REVIEW_4005",
    message: "page/size/sort 형식이 올바르지 않습니다.",
  },
  REVIEW_4006: {
    status: 400,
    code: "REVIEW_4006",
    message: "올바르지 않은 리뷰 태그입니다.",
  },
  REVIEW_4031: {
    status: 403,
    code: "REVIEW_4031",
    message: "본인의 예약만 리뷰를 작성할 수 있습니다.",
  },
  REVIEW_4032: {
    status: 403,
    code: "REVIEW_4032",
    message: "본인의 리뷰만 수정/삭제할 수 있습니다.",
  },
  REVIEW_4041: {
    status: 404,
    code: "REVIEW_4041",
    message: "존재하지 않는 예약입니다.",
  },
  REVIEW_4042: {
    status: 404,
    code: "REVIEW_4042",
    message: "존재하지 않는 리뷰입니다.",
  },
  REVIEW_4043: {
    status: 404,
    code: "REVIEW_4043",
    message: "추천한 적 없는 리뷰입니다.",
  },
  REVIEW_4044: {
    status: 404,
    code: "REVIEW_4044",
    message: "존재하지 않는 사진관입니다.",
  },
  REVIEW_4091: {
    status: 409,
    code: "REVIEW_4091",
    message: "이미 리뷰가 작성된 예약입니다.",
  },
  REVIEW_4092: {
    status: 409,
    code: "REVIEW_4092",
    message: "이미 추천한 리뷰입니다.",
  },
  REVIEW_5001: {
    status: 500,
    code: "REVIEW_5001",
    message: "리뷰 처리 중 오류가 발생했어요.",
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
