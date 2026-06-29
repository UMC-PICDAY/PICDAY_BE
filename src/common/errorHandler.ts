import type { ErrorRequestHandler } from "express";
import { AppError } from "./error.js";
import { fail } from "./response.js";
import { HTTP_STATUS } from "./constants.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(fail(err.message));
    return;
  }

  console.error(err);
  res
    .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json(fail("Internal server error"));
};
