import type { NextFunction, Request, Response } from "express";
import { success, SUCCESS_MESSAGE_HEADER } from "./response.js";

// 이미 { success, code, message, data } 형태로 완성된 응답인지 판별
// (마이그레이션 과도기 동안 success()/리터럴을 아직 안 걷어낸 컨트롤러 대응 → 이중 래핑 방지)
function isApiResponseShape(body: unknown): body is { success: boolean } {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    typeof (body as { success: unknown }).success === "boolean"
  );
}

export function responseWrapper(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => {
    if (isApiResponseShape(body)) {
      return originalJson(body);
    }

    const rawMessage = res.get(SUCCESS_MESSAGE_HEADER);
    if (rawMessage) {
      res.removeHeader(SUCCESS_MESSAGE_HEADER); // 내부용 헤더는 클라이언트에 노출 안 함
    }

    const code = res.statusCode === 201 ? "COMMON_201" : "COMMON_200";

    return rawMessage
      ? originalJson(success(body, decodeURIComponent(rawMessage), code))
      : originalJson(success(body, undefined, code));
  }) as typeof res.json;

  next();
}
