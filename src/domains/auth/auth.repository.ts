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

/** 토큰 갱신용: 저장된 refreshToken·status 확인을 위해 id로 조회 */
export async function findUserById(id: bigint) {
  return prisma.user.findUnique({
    where: { id },
  });
}

/** 로컬 로그인용: ACTIVE 상태의 LOCAL 유저를 loginId로 조회 */
export async function findActiveLocalUserByLoginId(loginId: string) {
  return prisma.user.findFirst({
    where: { loginId, provider: "LOCAL", status: "ACTIVE" },
  });
}

/** 로그인/로그아웃 시 refreshToken 저장 또는 삭제(null) */
export async function updateRefreshToken(
  userId: bigint,
  refreshToken: string | null,
) {
  return prisma.user.update({
    where: { id: userId },
    data: { refreshToken },
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

export async function getUserById(userId: bigint){
  return prisma.user.findUnique({
    where: { id: userId }
  });
}

export async function getUserByNickname(nickname: string){
  return prisma.user.findUnique({
    where: { nickname: nickname }
  })
}

export async function updateNickname(userId: bigint, nickname: string){
  return prisma.user.update({
    where: { id: userId },
    data: { nickname }
  })
}