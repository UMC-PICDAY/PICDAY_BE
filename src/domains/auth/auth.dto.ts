import { z } from "zod";

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
