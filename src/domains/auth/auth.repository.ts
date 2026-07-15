import { prisma } from "../../config/prisma.js";


export type CreateUserData = {
  loginId: string;
  password: string;
  name: string;
  nickname: string;
  email: string;
  phoneNumber: string;
};

export async function findUserByLoginId(loginId: string) {
  return prisma.user.findUnique({
    where: { loginId },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function findUserByNickname(nickname: string) {
  return prisma.user.findUnique({
    where: { nickname },
  });
}

export async function createUser(data: CreateUserData) {
  return prisma.user.create({
    data: {
      loginId: data.loginId,
      password: data.password,
      name: data.name,
      nickname: data.nickname,
      email: data.email,
      phoneNumber: data.phoneNumber,
      provider: "LOCAL",
      status: "ACTIVE",
    },
  });
}
