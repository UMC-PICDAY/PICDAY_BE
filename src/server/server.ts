import express, { Router } from "express";
import cors from "cors";
import multer from "multer";
import "dotenv/config";
import { IMAGE_UPLOAD } from "../common/constants.js";
import { AppError } from "../common/error.js";
import { errorHandler } from "../common/errorHandler.js";
import { success } from "../common/response.js";
import { responseWrapper } from "../common/responseWrapper.js";
import { RegisterRoutes } from "../generated/routes.js"; // tsoa가 자동 생성
import { setupSwagger } from "../config/swagger.js";
import { startAnonymizeWithdrawnUsersBatch } from "../batch/anonymizeWithdrawnUsers.batch.js";
import {
  runCompleteExpiredReservationsBatch,
  startCompleteExpiredReservationsBatch,
} from "../batch/completeExpiredReservations.batch.js";

const app = express();

const allowedOrigins: string[] = [
  "http://localhost:3000",
  process.env.FE_ORIGIN,
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => res.json(success("ok")));

setupSwagger(app);

const apiRouter = Router();
apiRouter.use(responseWrapper);
RegisterRoutes(apiRouter, {
  // Multer는 fileSize 임계값에 도달해도 LIMIT_FILE_SIZE를 발생시키므로,
  // 정책상 최대값(10MiB)을 포함해 허용하도록 1 byte 큰 임계값을 사용한다.
  multer: multer({
    limits: { fileSize: IMAGE_UPLOAD.MAX_FILE_SIZE_BYTES + 1 },
  }),
});
app.use(apiRouter);

app.use((_req, _res, next) => {
  next(new AppError("COMMON_404"));
});

app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, async () => {
  console.log(`server on ${PORT}`);
  startAnonymizeWithdrawnUsersBatch();
  await runCompleteExpiredReservationsBatch();
  startCompleteExpiredReservationsBatch();
});
