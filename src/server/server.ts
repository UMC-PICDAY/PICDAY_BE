import express, { Router } from "express";
import cors from "cors";
import "dotenv/config";
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
RegisterRoutes(apiRouter);
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
