import type { RequestHandler } from "express";
import { isValidApiIdNumber, isValidRawApiId } from "../../common/apiId.js";
import { AppError } from "../../common/error.js";
import { paymentMethodSchema } from "./reservation.dto.js";

// 예약 생성 요청 바디에서 허용하는 필드 목록.
// 여기 없는 필드가 오면(오타, 잘못된 클라이언트 스펙 등) 요청 자체를 거부한다.
const CREATE_RESERVATION_FIELDS = new Set([
  "studioId",
  "studioProductId",
  "timeSlotId",
  "reserveeName",
  "reserveePhone",
  "paymentMethod",
  "agreedTermIds",
]);

// req.body가 배열이나 null이 아니라 순수 객체({ ... } 형태)인지 확인하는 타입 가드.
// 이후 body.studioId 처럼 프로퍼티에 접근하기 전에 안전하게 좁히기 위해 사용.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// GET/PATCH 등 :reservationId 경로 파라미터를 쓰는 라우트에서
// id가 유효한 양의 정수 문자열인지 먼저 검증한다. (아직 number로 변환되기 전 단계)
export const validateReservationId: RequestHandler = (req, _res, next) => {
  if (!isValidRawApiId(req.params.reservationId)) {
    next(new AppError("RESERVATION_4005"));
    return;
  }

  next();
};

// 예약 생성(POST) 요청 바디를 검증한다.
// tsoa의 자동 타입 검증(ValidateError)보다 먼저 실행되어, 잘못된 요청에 대해
// 프로젝트 전용 에러 코드(RESERVATION_400x)로 더 구체적인 메시지를 내려주기 위한 미들웨어다.
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

  // 필수 예약자 정보(이름, 연락처)가 아예 없는 경우는 형식 오류가 아니라
  // "누락"으로 보고 별도 에러 코드(RESERVATION_4001)로 구분해서 응답한다.
  const hasMissingReserveeField = ["reserveeName", "reserveePhone"].some(
    (field) =>
      !Object.prototype.hasOwnProperty.call(body, field) ||
      body[field] === undefined,
  );

  if (hasMissingReserveeField) {
    next(new AppError("RESERVATION_4001"));
    return;
  }

  // 허용되지 않은 필드가 섞여 있는지 확인
  const hasUnexpectedField = Object.keys(body).some(
    (field) => !CREATE_RESERVATION_FIELDS.has(field),
  );
  // studioId/studioProductId/timeSlotId/agreedTermIds는 모두 API 응답 규격상 number여야 하므로
  // isValidApiIdNumber로 각각 검사한다. agreedTermIds는 배열이므로 모든 원소를 순회 검사.
  const hasInvalidId =
    !isValidApiIdNumber(body.studioId) ||
    !isValidApiIdNumber(body.studioProductId) ||
    !isValidApiIdNumber(body.timeSlotId) ||
    !Array.isArray(body.agreedTermIds) ||
    !body.agreedTermIds.every(isValidApiIdNumber);
  // 문자열 필드 타입과 paymentMethod가 정해진 enum 값(zod 스키마) 중 하나인지 검사
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
