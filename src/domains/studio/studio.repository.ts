import { prisma } from "../../config/prisma.js";

export async function findAllStudios() {
  // TODO: Studio 모델 추가 후 구현
  void prisma;
  return [];
}

export async function findStudioById(id: string) {
  // TODO: Studio 모델 추가 후 구현
  void id;
  void prisma;
  return null;
}

export async function createStudio(_data: {
  name: string;
  description?: string | undefined;
  address: string;
}) {
  // TODO: Studio 모델 추가 후 구현
  return null;
}

// === 예약 가능 시간 조회 API ===
export async function findStudioWithTimeSlotsByDate(
  studioId: bigint,
  date: Date,
) {
  return prisma.studio.findUnique({
    where: { id: studioId },
    select: {
      id: true,
      timeSlots: {
        where: { date },
        orderBy: { startTime: "asc" },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          isAvailable: true,
        },
      },
    },
  });
}

export type FindStudioWithTimeSlotsByDateResult = Awaited<
  ReturnType<typeof findStudioWithTimeSlotsByDate>
>;

// === 컨셉 사진 상세 조회 API ===
export async function findStudioForProductDetail(studioId: bigint) {
  return prisma.studio.findUnique({
    where: { id: studioId },
    select: {
      id: true,
      name: true,
    },
  });
}

export type FindStudioForProductDetailResult = Awaited<
  ReturnType<typeof findStudioForProductDetail>
>;

export async function findStudioProductDetailById(studioProductId: bigint) {
  return prisma.studioProduct.findUnique({
    where: { id: studioProductId },
    select: {
      id: true,
      studioId: true,
      name: true,
      productImages: {
        orderBy: { order: "asc" },
        select: {
          url: true,
        },
      },
    },
  });
}

export type FindStudioProductDetailByIdResult = Awaited<
  ReturnType<typeof findStudioProductDetailById>
>;
