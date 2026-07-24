import type { ErrorRequestHandler } from "express";
import { AppError } from "./error.js";
import { ZodError } from "zod";
import { fail } from "./response.js";
import { HTTP_STATUS } from "./constants.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(fail(err.code, err.message));
    return;
  }

  if (err instanceof ZodError) {
    // 요청 파싱 실패는 parseOrThrow에서 이미 AppError로 변환되어 여기 도달하지 않음
    // 즉 서버가 스키마와 다른 데이터를 만들어낸 내부 버그: 400이 아닌 500으로 처리
    console.error("[Unexpected ZodError]", err.issues);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(fail("COMMON_500", "서버 오류가 발생했습니다."));
    return;
  }


  console.error(err);
  res
    .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json(fail("COMMON_500", "서버 오류가 발생했습니다."));
};
