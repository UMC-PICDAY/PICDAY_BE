import { AppError } from "../../common/error.js";
import { HTTP_STATUS } from "../../common/constants.js";
import { loginSchema, registerSchema } from "./auth.dto.js";
import * as authRepository from "./auth.repository.js";

export async function register(body: unknown) {
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, parsed.error.message);
  }

  const existing = await authRepository.findUserByEmail(parsed.data.email);
  if (existing) {
    throw new AppError(HTTP_STATUS.CONFLICT, "Email already in use");
  }

  const user = await authRepository.createUser(parsed.data);
  if (!user) {
    throw new AppError(
      HTTP_STATUS.NOT_IMPLEMENTED,
      "Registration not implemented yet",
    );
  }

  return user;
}

export async function login(body: unknown) {
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, parsed.error.message);
  }

  const user = await authRepository.findUserByEmail(parsed.data.email);
  if (!user) {
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, "Invalid credentials");
  }

  // TODO: 비밀번호 검증 및 JWT 발급
  throw new AppError(HTTP_STATUS.NOT_IMPLEMENTED, "Login not implemented yet");
}
