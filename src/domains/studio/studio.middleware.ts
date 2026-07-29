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

// studioId 하나만 형식 검증하면 되는 라우트에서 사용 (STUDIO_40011)
// 사용하는 라우트:
// - POST /studios/{studioId}/recent-view (params)
// - GET /studios/search/name?studioId=... (query)
export const validateStudioIdFormat: RequestHandler = (req, _res, next) => {
  const studioId = req.params.studioId ?? req.query.studioId;

  if (!isValidRawApiId(studioId)) {
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

// GET /studios/compare/purposes?studioIds=1&studioIds=2 에서
// studioIds 각각이 유효한 양의 정수 문자열 형식인지만 검증한다.
// (개수가 2~3개인지, 중복이 없는지는 서비스 레이어의 zod 스키마에서 검증)
export const validateStudioCompareRequestIds: RequestHandler = (
  req,
  _res,
  next,
) => {
  const rawStudioIds = req.query.studioIds;

  if (rawStudioIds === undefined) {
    next(new AppError("STUDIO_40013"));
    return;
  }

  const studioIds = Array.isArray(rawStudioIds) ? rawStudioIds : [rawStudioIds];

  const isAllValidFormat = studioIds.every(
    (id) => typeof id === "string" && isValidRawApiId(id),
  );

  if (!isAllValidFormat) {
    next(new AppError("STUDIO_40011"));
    return;
  }

  next();
};
