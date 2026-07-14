import { ZodError } from "zod";
import { AppError } from "../../common/error.js";
import {
  createReservationResponseSchema,
  parseCreateReservationRequest,
  type CreateReservationResponseDto,
} from "./reservation.dto.js";
import * as reservationRepository from "./reservation.repository.js";
import {
  getReservationById,
  cancelReservation,
} from "./reservation.repository.js";
import { cancelReservationResponseSchema } from "./reservation.dto.js";

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

function isPastTimeSlot(date: Date, startTime: Date, now = new Date()) {
  const slotStart = new Date(date);
  slotStart.setHours(
    startTime.getHours(),
    startTime.getMinutes(),
    startTime.getSeconds(),
    0,
  );

  return slotStart.getTime() < now.getTime();
}

export async function createReservation(
  body: unknown,
  userId: bigint,
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
      isPastTimeSlot(references.timeSlot.date, references.timeSlot.startTime)
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

// ====== 예약 취소 ======
export async function cancel(reservationId: bigint) {
  // 예약이 존재하는지 확인
  const reservation = await getReservationById(reservationId);

  if (!reservation) {
    // 예약이 존재하지 않는다면
    throw new AppError("RESERVATION_4041");
  }

  if (reservation.status == "CANCELLED") {
    // 이미 취소된 예약이라면
    throw new AppError("RESERVATION_4092");
  }

  if (reservation.status == "COMPLETED") {
    // 이미 진행된 예약이라면
    throw new AppError("RESERVATION_4093");
  }

  // 촬영 당일 취소 시 로직
  const today = new Date();
  const shootingDate = reservation.timeSlot.date;

  const isSameDay =
    today.getFullYear() === shootingDate.getFullYear() &&
    today.getMonth() === shootingDate.getMonth() &&
    today.getDate() === shootingDate.getDate();

  if (isSameDay) {
    throw new AppError("RESERVATION_4002");
  }

  const updated = await cancelReservation(reservationId);

  return cancelReservationResponseSchema.parse({
    reservationId: updated.id,
    status: updated.status,
    canceledAt: updated.canceledAt,
  });
}
