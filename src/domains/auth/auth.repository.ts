import { prisma } from "../../config/prisma.js";

export async function findUserByEmail(email: string) {
  // TODO: User 모델 추가 후 구현
  void email;
  void prisma;
  return null;
}

export async function createUser(_data: {
  email: string;
  password: string;
  name: string;
}) {
  // TODO: User 모델 추가 후 구현
  return null;
}
