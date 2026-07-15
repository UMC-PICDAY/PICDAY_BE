import bcrypt from "bcrypt";
import { AppError } from "../../common/error.js";
import * as authRepository from "./auth.repository.js";
import type { SignupRequestDto } from "./auth.dto.js";
import {
  NICKNAME_ADJECTIVES,
  NICKNAME_NOUNS,
} from "./auth.nickname.constants.js";

function pickRandom<T extends readonly string[]>(items: T): T[number] {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomFourDigits(): string {
  return String(Math.floor(Math.random() * 10_000)).padStart(4, "0");
}

async function generateUniqueNickname(): Promise<string> {
  const adjective = pickRandom(NICKNAME_ADJECTIVES);
  const noun = pickRandom(NICKNAME_NOUNS);
  let nickname = `${adjective}${noun}${randomFourDigits()}`;

  while (await authRepository.findUserByNickname(nickname)) {
    nickname = `${adjective}${noun}${randomFourDigits()}`;
  }

  return nickname;
}

export async function register(dto: SignupRequestDto) {
  const existingLoginId = await authRepository.findUserByLoginId(dto.loginId);
  if (existingLoginId) {
    throw new AppError("AUTH_4093");
  }

  const existingEmail = await authRepository.findUserByEmail(dto.email);
  if (existingEmail) {
    throw new AppError("AUTH_4092");
  }

  const hashedPassword = await bcrypt.hash(dto.password, 10);
  const nickname = await generateUniqueNickname();

  // TODO: agreedTermsIds(dto.agreedTermsIds)를 UserTerms로 저장하는 로직 추가
  const user = await authRepository.createUser({
    loginId: dto.loginId,
    password: hashedPassword,
    name: dto.name,
    nickname,
    email: dto.email,
    phoneNumber: dto.phoneNumber,
  });

  const { password: _password, ...userWithoutPassword } = user;

  return {
    ...userWithoutPassword,
    id: user.id.toString(),
  };
}
