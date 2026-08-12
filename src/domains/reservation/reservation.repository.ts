import { prisma } from "../../config/prisma.js";
import {
  PaymentStatus,
  ReservationStatus,
  type PaymentMethod,
} from "../../generated/prisma/client.js";
import type { CreateReservationCommand } from "./reservation.dto.js";

type ReservationReferenceIds = Pick<
  CreateReservationCommand,
  "studioId" | "studioProductId" | "timeSlotId"
>;

const RESERVATION_COMPLETION_CANDIDATE_BATCH_SIZE = 500;

export class ReservationCancellationConflictError extends Error {
  constructor(public readonly reservationId: bigint) {
    super("예약이 더 이상 예약 상태가 아니어서 취소할 수 없습니다.");
    this.name = "ReservationCancellationConflictError";
  }
}

export type CreateReservationRepositoryInput = Omit<
  CreateReservationCommand,
  "paymentMethod"
> & {
  userId: bigint;
  paymentMethod: PaymentMethod;
};

export type CreateReservationOutcome =
  | { kind: "STUDIO_NOT_FOUND" }
  | { kind: "STUDIO_PRODUCT_NOT_FOUND" }
  | { kind: "TIME_SLOT_NOT_FOUND" }
  | {
      kind: "RELATION_MISMATCH";
      studioProductStudioId: bigint;
      timeSlotStudioId: bigint;
    }
  | {
      kind: "TERMS_INVALID";
      requiredTermIds: bigint[];
      missingRequiredTermIds: bigint[];
      unknownAgreedTermIds: bigint[];
    }
  | { kind: "SLOT_CONFLICT" }
  | {
      kind: "CREATED";
      reservation: {
        id: bigint;
        status: "RESERVED";
        totalPrice: number;
        createdAt: Date;
      };
    };

export const findReservationCreationReferences = async ({
  studioId,
  studioProductId,
  timeSlotId,
}: ReservationReferenceIds) => {
  const [studio, studioProduct, timeSlot, requiredTerms] = await Promise.all([
    prisma.studio.findUnique({
      where: { id: studioId },
      select: { id: true },
    }),
    prisma.studioProduct.findUnique({
      where: { id: studioProductId },
      select: {
        id: true,
        studioId: true,
        price: true,
      },
    }),
    prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      select: {
        id: true,
        studioId: true,
        date: true,
        startTime: true,
        endTime: true,
        isAvailable: true,
      },
    }),
    prisma.terms.findMany({
      where: { scope: "RESERVATION", isRequired: true },
      select: {
        id: true,
        type: true,
        version: true,
      },
    }),
  ]);

  return { studio, studioProduct, timeSlot, requiredTerms };
};

// 예약 생성
export const createReservation = async (
  input: CreateReservationRepositoryInput,
): Promise<CreateReservationOutcome> => {
  return prisma.$transaction(async (tx) => {
    const studio = await tx.studio.findUnique({
      where: { id: input.studioId },
      select: { id: true },
    });

    if (!studio) {
      return { kind: "STUDIO_NOT_FOUND" };
    }

    const studioProduct = await tx.studioProduct.findUnique({
      where: { id: input.studioProductId },
      select: {
        id: true,
        studioId: true,
        price: true,
      },
    });

    if (!studioProduct) {
      return { kind: "STUDIO_PRODUCT_NOT_FOUND" };
    }

    const timeSlot = await tx.timeSlot.findUnique({
      where: { id: input.timeSlotId },
      select: {
        id: true,
        studioId: true,
      },
    });

    if (!timeSlot) {
      return { kind: "TIME_SLOT_NOT_FOUND" };
    }

    if (
      studioProduct.studioId !== input.studioId ||
      timeSlot.studioId !== input.studioId
    ) {
      return {
        kind: "RELATION_MISMATCH",
        studioProductStudioId: studioProduct.studioId,
        timeSlotStudioId: timeSlot.studioId,
      };
    }

    const [requiredTerms, agreedTerms] = await Promise.all([
      tx.terms.findMany({
        where: { scope: "RESERVATION", isRequired: true },
        select: { id: true },
      }),
      tx.terms.findMany({
        where: { scope: "RESERVATION", id: { in: input.agreedTermIds } },
        select: { id: true },
      }),
    ]);

    const agreedTermIdSet = new Set(input.agreedTermIds);
    const existingTermIdSet = new Set(agreedTerms.map(({ id }) => id));
    const requiredTermIds = requiredTerms.map(({ id }) => id);
    const missingRequiredTermIds = requiredTermIds.filter(
      (id) => !agreedTermIdSet.has(id),
    );
    const unknownAgreedTermIds = input.agreedTermIds.filter(
      (id) => !existingTermIdSet.has(id),
    );

    if (missingRequiredTermIds.length > 0 || unknownAgreedTermIds.length > 0) {
      return {
        kind: "TERMS_INVALID",
        requiredTermIds,
        missingRequiredTermIds,
        unknownAgreedTermIds,
      };
    }

    const claimedSlot = await tx.timeSlot.updateMany({
      where: {
        id: input.timeSlotId,
        studioId: input.studioId,
        isAvailable: true,
      },
      data: { isAvailable: false },
    });

    if (claimedSlot.count !== 1) {
      return { kind: "SLOT_CONFLICT" };
    }

    const createdAt = new Date();
    const reservation = await tx.reservation.create({
      data: {
        userId: input.userId,
        timeSlotId: input.timeSlotId,
        studioProductId: input.studioProductId,
        reserveeName: input.reserveeName,
        reserveePhone: input.reserveePhone,
        totalPrice: studioProduct.price,
        createdAt,
      },
      select: {
        id: true,
        status: true,
        totalPrice: true,
        createdAt: true,
      },
    });

    await tx.payment.create({
      data: {
        reservationId: reservation.id,
        method: input.paymentMethod,
        amount: studioProduct.price,
        status: PaymentStatus.COMPLETED,
        completedAt: createdAt,
      },
    });

    await tx.reservationTerms.createMany({
      data: input.agreedTermIds.map((termsId) => ({
        reservationId: reservation.id,
        termsId,
        isAgreed: true,
        agreedAt: createdAt,
      })),
    });

    return {
      kind: "CREATED",
      reservation: {
        ...reservation,
        status: "RESERVED",
      },
    };
  });
};

// 예약 ID를 통한 예약 정보 가져오기
export const getReservationById = async (reservationId: bigint) => {
  return await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      timeSlot: true,
      studioProduct: {
        include: { studio: true },
      },
      review: { select: { id: true } },
    },
  });
};

// 촬영 완료 판정을 위한 예약 후보 조회
export const findReservedCompletionCandidates = async (
  cutoffDate: Date,
  afterId?: bigint,
) => {
  return await prisma.reservation.findMany({
    where: {
      status: ReservationStatus.RESERVED,
      ...(afterId !== undefined && { id: { gt: afterId } }),
      timeSlot: {
        date: { lte: cutoffDate },
      },
    },
    orderBy: { id: "asc" },
    take: RESERVATION_COMPLETION_CANDIDATE_BATCH_SIZE,
    select: {
      id: true,
      status: true,
      timeSlot: {
        select: {
          date: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });
};

// 예약 상태가 RESERVED인 경우에만 촬영 완료 처리
export const completeReservationsIfReserved = async (
  reservationIds: bigint[],
): Promise<number> => {
  if (reservationIds.length === 0) {
    return 0;
  }

  const result = await prisma.reservation.updateMany({
    where: {
      id: { in: reservationIds },
      status: ReservationStatus.RESERVED,
    },
    data: {
      status: ReservationStatus.COMPLETED,
    },
  });

  return result.count;
};

// 예약 취소
export const cancelReservation = async (reservationId: bigint) => {
  return await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        timeSlotId: true,
      },
    });

    if (!reservation) {
      throw new ReservationCancellationConflictError(reservationId);
    }

    const canceledAt = new Date();
    const result = await tx.reservation.updateMany({
      where: {
        id: reservationId,
        status: ReservationStatus.RESERVED,
      },
      data: {
        status: ReservationStatus.CANCELLED,
        canceledAt,
      },
    });

    if (result.count !== 1) {
      throw new ReservationCancellationConflictError(reservationId);
    }

    await tx.timeSlot.update({
      where: { id: reservation.timeSlotId },
      data: { isAvailable: true },
    });

    return {
      id: reservation.id,
      status: ReservationStatus.CANCELLED,
      canceledAt,
    };
  });
};

// 내 예약 조회
export const getReservationsByUserId = async (
  userId: bigint,
  status?: ReservationStatus,
) => {
  return await prisma.reservation.findMany({
    where: {
      userId,
      ...(status && { status }),
    },
    include: {
      studioProduct: {
        include: {
          studio: {
            include: {
              // 컨셉 목록 화면(studio.detail의 findStudioProducts)과 동일하게
              // id 오름차순 = 컨셉 순서, 각 컨셉의 대표 이미지는 order 최솟값
              products: {
                orderBy: { id: "asc" },
                select: {
                  id: true,
                  productImages: {
                    orderBy: { order: "asc" },
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
      },
      timeSlot: true,
      review: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// 진행 중인 예약이 존재하는지 확인
export const getActiveReservationByUserId = async (userId: bigint) => {
  return await prisma.reservation.findFirst({
    where: {
      userId,
      status: "RESERVED",
    },
  });
};
