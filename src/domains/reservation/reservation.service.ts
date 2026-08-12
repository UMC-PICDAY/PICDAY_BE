import { ZodError } from "zod";
import { AppError } from "../../common/error.js";
import { isPastKstTimeSlot, isSameKstDate } from "../../common/kstDateTime.js";
import {
  cancelReservationResponseSchema,
  createReservationResponseSchema,
  getMyReservationListResponseSchema,
  getReservationDetailResponseSchema,
  parseCreateReservationRequest,
  type CancelReservationResponseDto,
  type CreateReservationResponseDto,
  type GetReservationDetailResponseDto,
  type GetMyReservationListResponseDto,
  type ReservationStatus,
} from "./reservation.dto.js";
import * as reservationRepository from "./reservation.repository.js";

export const RESERVATION_CHECKLIST_ITEMS = [
  "의상 준비",
  "헤어·메이크업 준비",
  "위치 확인",
  "소품 챙기기",
] as const;

const KST_OFFSET_MILLISECONDS = 9 * 60 * 60 * 1000;

export type CompleteExpiredReservationsResult = {
  scannedCount: number;
  expiredCount: number;
  completedCount: number;
  skippedInvalidSlotCount: number;
};

function getUtcTimeSeconds(time: Date) {
  return (
    time.getUTCHours() * 60 * 60 +
    time.getUTCMinutes() * 60 +
    time.getUTCSeconds()
  );
}

function getKstCutoffDate(now: Date) {
  const kstNow = new Date(now.getTime() + KST_OFFSET_MILLISECONDS);

  return new Date(
    Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate(),
    ),
  );
}

function getKstShootingEndAt(date: Date, endTime: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      endTime.getUTCHours(),
      endTime.getUTCMinutes(),
      endTime.getUTCSeconds(),
    ) - KST_OFFSET_MILLISECONDS,
  );
}

function hasInvalidOrOvernightTimeSlot(startTime: Date, endTime: Date) {
  const startSeconds = getUtcTimeSeconds(startTime);
  const endSeconds = getUtcTimeSeconds(endTime);

  return (
    !Number.isFinite(startSeconds) ||
    !Number.isFinite(endSeconds) ||
    endSeconds <= startSeconds
  );
}

// ====== 예약 생성 ======
const REQUIRED_RESERVEE_FIELDS = new Set(["reserveeName", "reserveePhone"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasMissingReserveeField(error: ZodError, body: unknown) {
  if (!isRecord(body)) {
    return false;
  }

  return error.issues.some((issue) => {
    const field = issue.path[0];

    return (
      issue.code === "invalid_type" &&
      typeof field === "string" &&
      REQUIRED_RESERVEE_FIELDS.has(field) &&
      (!Object.prototype.hasOwnProperty.call(body, field) ||
        body[field] === undefined)
    );
  });
}

export async function create(
  body: unknown,
  userId: bigint,
  now: Date = new Date(),
): Promise<CreateReservationResponseDto> {
  try {
    let command;

    try {
      command = parseCreateReservationRequest(body);
    } catch (error) {
      if (error instanceof ZodError) {
        if (hasMissingReserveeField(error, body)) {
          throw new AppError("RESERVATION_4001");
        }
        throw new AppError("RESERVATION_4005");
      }
      throw error;
    }

    const references =
      await reservationRepository.findReservationCreationReferences(command);

    if (
      !references.studio ||
      !references.studioProduct ||
      !references.timeSlot
    ) {
      throw new AppError("RESERVATION_4043");
    }

    if (
      references.studioProduct.studioId !== command.studioId ||
      references.timeSlot.studioId !== command.studioId
    ) {
      throw new AppError("RESERVATION_4006");
    }

    const agreedTermIdSet = new Set(command.agreedTermIds);
    const hasMissingRequiredTerms = references.requiredTerms.some(
      ({ id }) => !agreedTermIdSet.has(id),
    );

    if (hasMissingRequiredTerms) {
      throw new AppError("RESERVATION_4007");
    }

    if (
      isPastKstTimeSlot(
        references.timeSlot.date,
        references.timeSlot.startTime,
        now,
      )
    ) {
      throw new AppError("RESERVATION_4004");
    }

    const outcome = await reservationRepository.createReservation({
      ...command,
      userId,
    });

    switch (outcome.kind) {
      case "STUDIO_NOT_FOUND":
      case "STUDIO_PRODUCT_NOT_FOUND":
      case "TIME_SLOT_NOT_FOUND":
        throw new AppError("RESERVATION_4043");

      case "RELATION_MISMATCH":
        throw new AppError("RESERVATION_4006");

      case "TERMS_INVALID":
        if (outcome.unknownAgreedTermIds.length > 0) {
          throw new AppError("RESERVATION_4005");
        }
        throw new AppError("RESERVATION_4007");

      case "SLOT_CONFLICT":
        throw new AppError("RESERVATION_4091");

      case "CREATED":
        return createReservationResponseSchema.parse({
          reservationId: outcome.reservation.id,
          status: outcome.reservation.status,
          totalPrice: outcome.reservation.totalPrice,
          createdAt: outcome.reservation.createdAt,
        });
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("RESERVATION_5001");
  }
}

// ====== 촬영 종료 예약 완료 처리 ======
export async function completeExpiredReservations(
  now: Date = new Date(),
): Promise<CompleteExpiredReservationsResult> {
  const cutoffDate = getKstCutoffDate(now);
  const result: CompleteExpiredReservationsResult = {
    scannedCount: 0,
    expiredCount: 0,
    completedCount: 0,
    skippedInvalidSlotCount: 0,
  };
  let afterId: bigint | undefined;

  while (true) {
    const candidates =
      await reservationRepository.findReservedCompletionCandidates(
        cutoffDate,
        afterId,
      );

    if (candidates.length === 0) {
      return result;
    }

    result.scannedCount += candidates.length;
    const expiredReservationIds: bigint[] = [];

    for (const candidate of candidates) {
      if (
        hasInvalidOrOvernightTimeSlot(
          candidate.timeSlot.startTime,
          candidate.timeSlot.endTime,
        )
      ) {
        result.skippedInvalidSlotCount += 1;
        continue;
      }

      const shootingEndAt = getKstShootingEndAt(
        candidate.timeSlot.date,
        candidate.timeSlot.endTime,
      );

      if (!Number.isFinite(shootingEndAt.getTime())) {
        result.skippedInvalidSlotCount += 1;
        continue;
      }

      if (shootingEndAt.getTime() <= now.getTime()) {
        result.expiredCount += 1;
        expiredReservationIds.push(candidate.id);
      }
    }

    if (expiredReservationIds.length > 0) {
      result.completedCount +=
        await reservationRepository.completeReservationsIfReserved(
          expiredReservationIds,
        );
    }

    const nextAfterId = candidates[candidates.length - 1]?.id;

    if (
      nextAfterId === undefined ||
      (afterId !== undefined && nextAfterId <= afterId)
    ) {
      throw new Error("예약 완료 후보 cursor가 전진하지 않았습니다.");
    }

    afterId = nextAfterId;
  }
}

// ====== 예약 취소 ======
export async function cancel(
  reservationId: bigint,
  userId: bigint,
  now: Date = new Date(),
): Promise<CancelReservationResponseDto> {
  // 예약이 존재하는지 확인
  const reservation =
    await reservationRepository.getReservationById(reservationId);

  if (!reservation) {
    // 예약이 존재하지 않는다면
    throw new AppError("RESERVATION_4041");
  }

  if (reservation.userId !== userId) {
    // 내 예약이 아니라면
    throw new AppError("RESERVATION_4042");
  }

  if (reservation.status === "CANCELLED") {
    // 이미 취소된 예약이라면
    throw new AppError("RESERVATION_4092");
  }

  if (reservation.status === "COMPLETED") {
    // 이미 진행된 예약이라면
    throw new AppError("RESERVATION_4093");
  }

  // 촬영 당일 취소 시 로직
  const shootingDate = reservation.timeSlot.date;

  const isSameDay = isSameKstDate(shootingDate, now);

  if (isSameDay) {
    throw new AppError("RESERVATION_4002");
  }

  let updated: Awaited<
    ReturnType<typeof reservationRepository.cancelReservation>
  >;

  try {
    updated = await reservationRepository.cancelReservation(reservationId);
  } catch (error) {
    if (
      !(
        error instanceof
        reservationRepository.ReservationCancellationConflictError
      )
    ) {
      throw error;
    }

    const latestReservation =
      await reservationRepository.getReservationById(reservationId);

    if (!latestReservation) {
      throw new AppError("RESERVATION_4041");
    }

    if (latestReservation.userId !== userId) {
      throw new AppError("RESERVATION_4042");
    }

    if (latestReservation.status === "CANCELLED") {
      throw new AppError("RESERVATION_4092");
    }

    if (latestReservation.status === "COMPLETED") {
      throw new AppError("RESERVATION_4093");
    }

    throw new AppError("COMMON_409");
  }

  return cancelReservationResponseSchema.parse({
    reservationId: updated.id,
    status: updated.status,
    canceledAt: updated.canceledAt,
  });
}

// ===== 예약 상세조회 =====
export async function detail(
  reservationId: bigint,
  userId: bigint,
): Promise<GetReservationDetailResponseDto> {
  const reservation =
    await reservationRepository.getReservationById(reservationId);

  if (!reservation) {
    throw new AppError("RESERVATION_4041");
  }

  if (reservation.userId !== userId) {
    throw new AppError("RESERVATION_4042");
  }

  return getReservationDetailResponseSchema.parse({
    reservationId: reservation.id,
    status: reservation.status,
    reserveeName: reservation.reserveeName,
    reserveePhone: reservation.reserveePhone,
    totalPrice: reservation.totalPrice,
    studio: {
      id: reservation.studioProduct.studio.id,
      name: reservation.studioProduct.studio.name,
    },
    studioProduct: {
      id: reservation.studioProduct.id,
      name: reservation.studioProduct.name,
      price: reservation.studioProduct.price,
    },
    timeSlot: {
      date: reservation.timeSlot.date,
      startTime: reservation.timeSlot.startTime,
      endTime: reservation.timeSlot.endTime,
    },
    reviewId: reservation.review?.id ?? null,
    checklist: RESERVATION_CHECKLIST_ITEMS,
    createdAt: reservation.createdAt,
    canceledAt: reservation.canceledAt,
  });
}
// 왼쪽 = 예약한 컨셉 자신의 대표 이미지, 오른쪽 = 컨셉 목록(id asc)상 바로 다음 컨셉의 대표 이미지
type ConceptRow = { id: bigint; productImages: { url: string }[] };

function pickConceptThumbnails(
  currentProductId: bigint,
  products: ConceptRow[],
): [string | null, string | null] {
  const currentIndex = products.findIndex((p) => p.id === currentProductId);
  const currentProduct = products[currentIndex];
  if (!currentProduct) return [null, null];

  const thumbnailUrl = currentProduct.productImages[0]?.url ?? null;
  const secondThumbnailUrl =
    products[currentIndex + 1]?.productImages[0]?.url ?? null;

  return [thumbnailUrl, secondThumbnailUrl];
}

// ====== 내 예약 조회 ======
export async function list(
  userId: bigint,
  status?: ReservationStatus,
): Promise<GetMyReservationListResponseDto> {
  const reservations = await reservationRepository.getReservationsByUserId(
    userId,
    status,
  );

  const data = reservations.map((reservation) => {
    const [thumbnailUrl, secondThumbnailUrl] = pickConceptThumbnails(
      reservation.studioProduct.id,
      reservation.studioProduct.studio.products,
    );

  return {
    reservationId: reservation.id,
    studioName: reservation.studioProduct.studio.name,
    thumbnailUrl,
    secondThumbnailUrl,
    conceptName: reservation.studioProduct.name,
    reservationDate: reservation.timeSlot.date,
    reservationTime: reservation.timeSlot.startTime.toISOString().slice(11, 16),
    totalPrice: reservation.totalPrice,
    status: reservation.status,
    reviewId: reservation.review?.id ?? null,
    };
  });

  return getMyReservationListResponseSchema.parse(data);
}
