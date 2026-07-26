import type { RequestHandler } from "express";
import { isValidApiIdNumber, isValidRawApiId } from "../../common/apiId.js";
import { AppError } from "../../common/error.js";
import { paymentMethodSchema } from "./reservation.dto.js";

const CREATE_RESERVATION_FIELDS = new Set([
  "studioId",
  "studioProductId",
  "timeSlotId",
  "reserveeName",
  "reserveePhone",
  "paymentMethod",
  "agreedTermIds",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const validateReservationId: RequestHandler = (req, _res, next) => {
  if (!isValidRawApiId(req.params.reservationId)) {
    next(new AppError("RESERVATION_4005"));
    return;
  }

  next();
};

export const validateCreateReservationRequest: RequestHandler = (
  req,
  _res,
  next,
) => {
  const body: unknown = req.body;

  if (!isRecord(body)) {
    next(new AppError("RESERVATION_4005"));
    return;
  }

  const hasMissingReserveeField = ["reserveeName", "reserveePhone"].some(
    (field) =>
      !Object.prototype.hasOwnProperty.call(body, field) ||
      body[field] === undefined,
  );

  if (hasMissingReserveeField) {
    next(new AppError("RESERVATION_4001"));
    return;
  }

  const hasUnexpectedField = Object.keys(body).some(
    (field) => !CREATE_RESERVATION_FIELDS.has(field),
  );
  const hasInvalidId =
    !isValidApiIdNumber(body.studioId) ||
    !isValidApiIdNumber(body.studioProductId) ||
    !isValidApiIdNumber(body.timeSlotId) ||
    !Array.isArray(body.agreedTermIds) ||
    !body.agreedTermIds.every(isValidApiIdNumber);
  const hasInvalidShape =
    typeof body.reserveeName !== "string" ||
    typeof body.reserveePhone !== "string" ||
    !paymentMethodSchema.safeParse(body.paymentMethod).success;

  if (hasUnexpectedField || hasInvalidId || hasInvalidShape) {
    next(new AppError("RESERVATION_4005"));
    return;
  }

  next();
};
