import { prisma } from "../../config/prisma.js";
import { Prisma, type Provider } from "../../generated/prisma/client.js";


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

/**
 * 로컬 로그인용: ACTIVE 상태의 유저를 loginId로 조회.
 * loginId는 자체 회원가입에서만 채워지므로(소셜 가입 유저는 null) loginId 조회 자체가 LOCAL 한정이다.
 */
export async function findActiveLocalUserByLoginId(loginId: string) {
  return prisma.user.findFirst({
    where: { loginId, status: "ACTIVE" },
  });
}

/** 소셜 로그인용: (provider, providerId)로 소셜 계정과 연결된 유저를 함께 조회 */
export async function findSocialAccountWithUser(
  provider: Provider,
  providerId: string,
) {
  return prisma.socialAccount.findUnique({
    where: { provider_providerId: { provider, providerId } },
    include: { user: true },
  });
}

/**
 * 유저에 연결된 소셜 계정의 provider를 조회한다. (가장 먼저 연결된 계정 기준)
 * 연결된 소셜 계정이 없으면 null — 자체(LOCAL) 가입 유저를 의미한다.
 * provider는 SocialAccount가 단일 출처이므로, 표시용 provider는 여기서 유도한다.
 */
export async function findPrimarySocialProvider(
  userId: bigint,
): Promise<Provider | null> {
  const account = await prisma.socialAccount.findFirst({
    where: { userId },
    orderBy: { id: "asc" },
    select: { provider: true },
  });
  return account?.provider ?? null;
}

/** 로그인/로그아웃 시 refreshToken·만료 시각 저장 또는 삭제(null) */
export async function updateRefreshToken(
  userId: bigint,
  refreshToken: string | null,
  refreshTokenExpiresAt: Date | null,
) {
  return prisma.user.update({
    where: { id: userId },
    data: { refreshToken, refreshTokenExpiresAt },
  });
}

/** 약관 검증용: 회원가입 필수 약관(SIGNUP scope, isRequired=true)의 ID 목록 */
export async function findRequiredTermIds(): Promise<bigint[]> {
  const terms = await prisma.terms.findMany({
    where: { scope: "SIGNUP", isRequired: true },
    select: { id: true },
  });
  return terms.map((term) => term.id);
}

/**
 * 약관 검증용: 주어진 ID 중 실제 존재하는 회원가입(SIGNUP) 약관 ID 목록.
 * scope로 한정해, 예약용 약관 ID를 회원가입에 섞어 보내면 미존재로 판별한다.
 */
export async function findExistingTermIds(ids: bigint[]): Promise<bigint[]> {
  if (ids.length === 0) {
    return [];
  }
  const terms = await prisma.terms.findMany({
    where: { scope: "SIGNUP", id: { in: ids } },
    select: { id: true },
  });
  return terms.map((term) => term.id);
}

/**
 * 자체 회원가입: 유저 생성과 약관 동의 저장을 한 트랜잭션으로 원자적으로 처리한다.
 * 유저만 생성되고 약관 동의가 유실되는 부분 실패를 방지한다.
 */
export async function createUserWithTerms(
  data: CreateUserData,
  agreedTermIds: bigint[],
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        loginId: data.loginId,
        password: data.password,
        name: data.name,
        nickname: data.nickname,
        email: data.email,
        phoneNumber: data.phoneNumber,
        status: "ACTIVE",
      },
    });

    if (agreedTermIds.length > 0) {
      const agreedAt = new Date();
      await tx.userTerms.createMany({
        data: agreedTermIds.map((termsId) => ({
          userId: user.id,
          termsId,
          isAgreed: true,
          agreedAt,
        })),
      });
    }

    return user;
  });
}

export type CreateSocialUserData = {
  provider: Provider;
  providerId: string;
  email: string | null;
  name: string | null;
  phoneNumber: string | null;
  nickname: string;
};

export type CreateSocialUserOutcome =
  | { kind: "CREATED"; user: Awaited<ReturnType<typeof prisma.user.create>> }
  // signupToken 재사용(이미 가입 완료된 소셜 계정으로 재요청) — SocialAccount unique 제약 위반
  | { kind: "ALREADY_REGISTERED" };

/**
 * 소셜 회원가입 완료: 유저 생성·SocialAccount 연결·약관 동의 저장을 한 트랜잭션으로 처리한다.
 * signupToken이 이미 소비된 경우(SocialAccount 중복) ALREADY_REGISTERED를 반환한다.
 */
export async function createSocialUserWithTerms(
  data: CreateSocialUserData,
  agreedTermIds: bigint[],
): Promise<CreateSocialUserOutcome> {
  try {
    const user = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          nickname: data.nickname,
          email: data.email,
          phoneNumber: data.phoneNumber,
          status: "ACTIVE",
        },
      });

      await tx.socialAccount.create({
        data: {
          userId: user.id,
          provider: data.provider,
          providerId: data.providerId,
        },
      });

      if (agreedTermIds.length > 0) {
        const agreedAt = new Date();
        await tx.userTerms.createMany({
          data: agreedTermIds.map((termsId) => ({
            userId: user.id,
            termsId,
            isAgreed: true,
            agreedAt,
          })),
        });
      }

      return user;
    });

    return { kind: "CREATED", user };
  } catch (error) {
    // UNIQUE(provider, provider_id) 제약 위반 = signupToken 재사용(이미 가입 완료됨)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { kind: "ALREADY_REGISTERED" };
    }
    throw error;
  }
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

// 회원 탈퇴 - soft delete
export async function withdrawUser(userId: bigint) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      status: "WITHDRAWN",
      deletedAt: new Date(),
      refreshToken: null,
      refreshTokenExpiresAt: null,
    },
  });
}

// 탈퇴 후 익명화 대상 조회
export async function findUsersEligibleForAnonymization(cutoff: Date) {
  return prisma.user.findMany({
    where: {
      status: "WITHDRAWN",
      deletedAt: { lte: cutoff },
      loginId: { not: null },
    },
    select: { id: true },
  });
}

// 개인정보 익명화 처리
export async function anonymizeUser(userId: bigint) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      loginId: null,
      password: null,
      name: null,
      nickname: `탈퇴한회원_${userId}`,
      email: null,
      phoneNumber: null,
      refreshToken: null,
      refreshTokenExpiresAt: null,
    },
  });
}
