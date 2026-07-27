import type { RequestHandler } from "express";
import { AppError } from "../../common/error.js";
import { isValidRawApiId } from "../../common/apiId.js";

// :studioId 경로 파라미터만 쓰는 라우트(GET /studios/:studioId 등)에서
// id가 유효한 양의 정수 문자열인지 검증한다.
export const validateStudioId: RequestHandler = (req, _res, next) => {
  if (!isValidRawApiId(req.params.studioId)) {
    next(new AppError("STUDIO_4001"));
    return;
  }

  next();
};

// id 별 에러 확인
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

// {studioId}/recent-view 라우트 전용 검증
export const validateRecentStudioViewRequestId: RequestHandler = (
  req,
  _res,
  next,
) => {
  if (!isValidRawApiId(req.params.studioId)) {
    next(new AppError("STUDIO_40011"));
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
