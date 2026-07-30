import { prisma } from "../../config/prisma.js";
import type { PaymentMethod } from "../../generated/prisma/client.js";
import { PaymentStatus } from "../../generated/prisma/client.js";
import type { CreateReservationCommand } from "./reservation.dto.js";

import { type ReservationStatus } from "./reservation.dto.js";

type ReservationReferenceIds = Pick<
  CreateReservationCommand,
  "studioId" | "studioProductId" | "timeSlotId"
>;

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
      review: { select: { id: true }}
    },
  });
};

// 예약 취소
export const cancelReservation = async (reservationId: bigint) => {
  return await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: "CANCELLED",
        canceledAt: new Date(),
      },
    });

    await tx.timeSlot.update({
      where: { id: reservation.timeSlotId },
      data: { isAvailable: true },
    });

    return reservation;
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
        include: { studio: {
          include:{
            products:{
              select:{
                productImages:{
                  where: { studioThumbnailOrder : { not : null } },
                  orderBy: [{ studioThumbnailOrder: "asc" },{ id:"asc" }],
                  select: { url:true, studioThumbnailOrder:true }
                },
              },
            },
          },
        } },
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
