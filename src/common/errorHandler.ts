import type { ErrorRequestHandler } from "express";
import { AppError } from "./error.js";
import { ZodError } from "zod";
import { ValidateError } from "tsoa"; // tsoa가 생성한 라우터(src/generated/routes.ts)가 경로/쿼리/바디 타입 검증에 실패하면 던지는 에러 클래스
import multer from "multer";
import { fail } from "./response.js";
import { HTTP_STATUS } from "./constants.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(fail(err.code, err.message));
    return;
  }

  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    const fileSizeError = new AppError("IMAGE_4002");
    res
      .status(fileSizeError.statusCode)
      .json(fail(fileSizeError.code, fileSizeError.message));
    return;
  }

  if (
    err instanceof SyntaxError &&
    "type" in err &&
    err.type === "entity.parse.failed"
  ) {
    res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(fail("COMMON_400", "요청 형식이 올바르지 않습니다."));
    return;
  }

  // 요청 파싱 실패는 parseOrThrow에서 이미 AppError로 변환되어 여기 도달하지 않음

  if (err instanceof ValidateError) {
    // tsoa의 요청 검증 실패(경로·쿼리·바디 타입 불일치 등) = 클라이언트 요청 오류

    // studioId 등 id 관련 커스텀 미들웨어(validateStudioId 등)가 대부분 먼저 걸러내지만,
    // 미들웨어가 없는 라우트나 바디의 세부 필드 타입은 tsoa가 최종적으로 검증하며 여기서 잡힘
    console.warn("[ValidateError]", err.fields);
    res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(fail("COMMON_400", "요청 형식이 올바르지 않습니다."));
    return;
  }

  if (err instanceof ZodError) {
    // 즉 서버가 스키마와 다른 데이터를 만들어낸 내부 버그: 500으로 처리
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
