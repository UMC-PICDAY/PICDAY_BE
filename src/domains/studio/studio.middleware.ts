import type { RequestHandler } from "express";
import { AppError } from "../../common/error.js";
import { isValidRawApiId } from "../../common/apiId.js";

export const validateStudioId: RequestHandler = (req, _res, next) => {
  if (!isValidRawApiId(req.params.studioId)) {
    next(new AppError("STUDIO_4001"));
    return;
  }

  next();
};

export const validateStudioProductsRequestIds: RequestHandler = (
  req,
  _res,
  next,
) => {
  const hasStructuredTimeSlotId = Object.keys(req.query).some((key) =>
    key.startsWith("timeSlotId["),
  );

  if (
    !isValidRawApiId(req.params.studioId) ||
    hasStructuredTimeSlotId ||
    (req.query.timeSlotId !== undefined &&
      !isValidRawApiId(req.query.timeSlotId))
  ) {
    next(new AppError("STUDIO_4001"));
    return;
  }

  next();
};

export const validateStudioProductDetailRequestIds: RequestHandler = (
  req,
  _res,
  next,
) => {
  if (!isValidRawApiId(req.params.studioId)) {
    next(new AppError("STUDIO_40011"));
    return;
  }

  if (!isValidRawApiId(req.params.studioProductId)) {
    next(new AppError("STUDIO_4006"));
    return;
  }

  next();
};
