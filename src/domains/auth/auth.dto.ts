import { z, ZodError } from "zod";
import { AppError } from "../../common/error.js";
import type { ErrorCodeType } from "../../common/errorCode.js";

export const signupRequestSchema = z.object({
  loginId: z
    .string()
    .regex(
      /^[a-z][a-z0-9]{3,11}$/,
      "아이디는 영문 소문자로 시작하는 4~12자의 영문 소문자·숫자만 사용할 수 있습니다.",
    ),
  password: z
    .string()
    .min(8, "비밀번호는 8~20자여야 합니다.")
    .max(20, "비밀번호는 8~20자여야 합니다.")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/,
      "비밀번호는 영문, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.",
    ),
  name: z.string().min(1, "이름을 입력해 주세요."),
  email: z.email("유효한 이메일 형식이 아닙니다."),
  phoneNumber: z
    .string()
    .regex(/^\d+$/, "휴대폰 번호는 하이픈 없이 숫자만 입력해 주세요."),
  agreedTermsIds: z.array(z.number()),
});

export type SignupRequestDto = z.infer<typeof signupRequestSchema>;

// 로그인은 필수 여부만 검증 (형식 오류도 인증 실패와 동일하게 AUTH_4015로 수렴)
export const loginRequestSchema = z.object({
  loginId: z.string().min(1, "아이디를 입력해 주세요."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
});

export type LoginRequestDto = z.infer<typeof loginRequestSchema>;

/**
 * 토큰 갱신 요청 body.
 * refreshToken은 선택 — @Security("refresh")로 Authorization 헤더가 이미 필수이며,
 * body에 담아 보내는 클라이언트(명세서 (B)안)를 함께 수용하기 위한 필드다.
 */
export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken이 비어 있습니다.").optional(),
});

export type RefreshRequestDto = z.infer<typeof refreshRequestSchema>;

function parseOrThrow<T>(
  schema: z.ZodType<T>,
  body: unknown,
  map: Record<string, ErrorCodeType>,
): T {
  try {
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const field = err.issues[0]?.path[0];
      const code = typeof field === "string" ? map[field] : undefined;
      throw new AppError(code ?? "COMMON_400");
    }
    throw err;
  }
}

const SIGNUP_FIELD_ERROR: Record<string, ErrorCodeType> = {
  loginId: "AUTH_4006",
  password: "AUTH_4005",
  email: "AUTH_4004",
  phoneNumber: "AUTH_4007",
};

// 로그인은 필드 누락도 계정 정보 노출 방지를 위해 AUTH_4015로 수렴
const LOGIN_FIELD_ERROR: Record<string, ErrorCodeType> = {
  loginId: "AUTH_4015",
  password: "AUTH_4015",
};

// 토큰 관련 형식 오류는 명세서상 모두 AUTH_4013으로 수렴
const REFRESH_FIELD_ERROR: Record<string, ErrorCodeType> = {
  refreshToken: "AUTH_4013",
};

export const parseSignup = (body: unknown) =>
  parseOrThrow(signupRequestSchema, body, SIGNUP_FIELD_ERROR);
export const parseLogin = (body: unknown) =>
  parseOrThrow(loginRequestSchema, body, LOGIN_FIELD_ERROR);
// body를 아예 보내지 않는 (A)안 클라이언트를 위해 undefined/null은 빈 객체로 취급
export const parseRefresh = (body: unknown) =>
  parseOrThrow(refreshRequestSchema, body ?? {}, REFRESH_FIELD_ERROR);
