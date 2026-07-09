// error.ts

import { ErrorCode, type ErrorCodeType } from "./errorCode.js";

export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(
    errorCodeType: ErrorCodeType,
    overrideMessage?: string
  ) {
    const { status, code, message } = ErrorCode[errorCodeType];

    super(overrideMessage ?? message);
    this.name = "AppError";
    this.statusCode = status;
    this.code = code;

    Object.setPrototypeOf(this, AppError.prototype);

  }
}
