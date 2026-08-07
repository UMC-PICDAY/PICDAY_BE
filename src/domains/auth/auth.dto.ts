import { z, ZodError } from "zod";
import { AppError } from "../../common/error.js";
import type { ErrorCodeType } from "../../common/errorCode.js";
import type { Provider } from "../../generated/prisma/client.js";

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

// 소셜 로그인 요청 (카카오·구글 공통)
export const socialLoginRequestSchema = z
  .object({
    authorizationCode: z.string().min(1, "인가 코드가 필요합니다."),
    redirectUri: z.string().min(1, "redirectUri가 필요합니다."),
  })
  .strict();

export type SocialLoginRequestDto = z.infer<typeof socialLoginRequestSchema>;

// 소셜 로그인 응답: 기존 유저(로그인 완료) | 신규 유저(추가 정보 필요)
export type SocialLoginResponseData =
  | {
      isNewUser: false;
      user: {
        id: number;
        nickname: string | null;
        email: string | null;
        profileImageUrl: string | null;
        provider: Provider;
      };
      token: {
        accessToken: string;
        refreshToken: string;
        accessTokenExpiresIn: number;
        refreshTokenExpiresIn: number;
      };
    }
  | {
      isNewUser: true;
      signupToken: string;
      socialInfo: {
        id: string;
        email: string | null;
        name: string | null;
        phoneNumber: string | null;
      };
    };

// 소셜 회원가입 완료 요청
export const completeSocialSignupRequestSchema = z
  .object({
    agreedTermsIds: z.array(z.number()),
  })
  .strict();

export type CompleteSocialSignupRequestDto = z.infer<
  typeof completeSocialSignupRequestSchema
>;

export const completeSocialSignupResponseSchema = z.object({
  user: z.object({
    id: z.bigint().transform((id) => Number(id)),
    nickname: z.string().nullable(),
    provider: z.enum(["KAKAO", "GOOGLE", "APPLE", "LOCAL"]).nullable(),
  }),
  token: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    accessTokenExpiresIn: z.number(),
    refreshTokenExpiresIn: z.number(),
  }),
});

export type CompleteSocialSignupResponseDto = z.output<
  typeof completeSocialSignupResponseSchema
>;

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

// 소셜 로그인 필드 누락은 명세서 에러 코드로 수렴 (코드 → AUTH_4011, redirectUri → AUTH_4001)
const SOCIAL_LOGIN_FIELD_ERROR: Record<string, ErrorCodeType> = {
  authorizationCode: "AUTH_4011",
  redirectUri: "AUTH_4001",
};

// 토큰 관련 형식 오류는 명세서상 모두 AUTH_4013으로 수렴
const REFRESH_FIELD_ERROR: Record<string, ErrorCodeType> = {
  refreshToken: "AUTH_4013",
};

const COMPLETE_SOCIAL_SIGNUP_FIELD_ERROR: Record<string, ErrorCodeType> = {
  agreedTermsIds: "AUTH_4008",
};

export const parseSignup = (body: unknown) =>
  parseOrThrow(signupRequestSchema, body, SIGNUP_FIELD_ERROR);
export const parseLogin = (body: unknown) =>
  parseOrThrow(loginRequestSchema, body, LOGIN_FIELD_ERROR);
export const parseSocialLogin = (body: unknown) =>
  parseOrThrow(socialLoginRequestSchema, body, SOCIAL_LOGIN_FIELD_ERROR);
export const parseCompleteSocialSignup = (body: unknown) =>
  parseOrThrow(
    completeSocialSignupRequestSchema,
    body,
    COMPLETE_SOCIAL_SIGNUP_FIELD_ERROR,
  );
// body를 아예 보내지 않는 (A)안 클라이언트를 위해 undefined/null은 빈 객체로 취급
export const parseRefresh = (body: unknown) =>
  parseOrThrow(refreshRequestSchema, body ?? {}, REFRESH_FIELD_ERROR);

// 해당 Schema로 get / update response 모두 사용
export const getMeResponseSchema = z.object({
  user: z.object({
    id: z.bigint().transform((id) => Number(id)),
    name: z.string().nullable(),
    nickname: z.string().nullable(),
    email: z.email().nullable(),
    //profileImageUrl: z.url().nullable(),
    provider: z.enum(["KAKAO", "GOOGLE", "APPLE", "LOCAL"]),
    // notification: z.object({
    //   reservation: z.boolean(),
    //   marketing: z.boolean(),
    // }),
  }),
});

export type GetMeResponseDto = z.output<typeof getMeResponseSchema>;

export const updateNicknameRequestSchema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임 형식이 올바르지 않아요.")
    .max(10, "닉네임 형식이 올바르지 않아요.")
    .regex(/^[가-힣a-zA-Z0-9]+$/, "닉네임 형식이 올바르지 않아요."),
});

export type UpdateNicknameRequestDto = z.infer<typeof updateNicknameRequestSchema>;

export const updateNicknameResponseSchema = z.object({
  user: z.object({
    id: z.bigint().transform((id) => Number(id)),
    nickname: z.string(),
  }),
});

export type UpdateNicknameResponseDto = z.infer<typeof updateNicknameResponseSchema>;

const UPDATE_NICKNAME_FIELD_ERROR: Record<string, ErrorCodeType> = {
  nickname: "AUTH_4003",
};

export const parseUpdateNickname = (body: unknown) =>
  parseOrThrow(updateNicknameRequestSchema, body, UPDATE_NICKNAME_FIELD_ERROR);