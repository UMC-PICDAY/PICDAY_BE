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

// === 컨셉 목록 조회 API ===
export async function findStudioProducts(studioId: bigint) {
  return prisma.studio.findUnique({
    where: { id: studioId },
    select: {
      id: true,
      name: true,
      products: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          shootingCategory: true,
          name: true,
          price: true,
          basePeople: true,
          shortDescription: true,
          productImages: {
            orderBy: { order: "asc" },
            select: {
              url: true,
              order: true,
            },
          },
        },
      },
    },
  });
}

export type FindStudioProductsResult = Awaited<
  ReturnType<typeof findStudioProducts>
>;

export async function findTimeSlotById(timeSlotId: bigint) {
  return prisma.timeSlot.findUnique({
    where: { id: timeSlotId },
    select: {
      id: true,
      studioId: true,
      date: true,
      startTime: true,
      endTime: true,
      isAvailable: true,
    },
  });
}

export type FindTimeSlotByIdResult = Awaited<
  ReturnType<typeof findTimeSlotById>
>;
