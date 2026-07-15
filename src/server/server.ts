import express, { Router } from "express";
import "dotenv/config";
import { errorHandler } from "../common/errorHandler.js";
import { success } from "../common/response.js";
import { RegisterRoutes } from "../generated/routes.js"; // tsoa가 자동 생성

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json(success("ok")));

const apiRouter = Router();
RegisterRoutes(apiRouter);
app.use("/api/v1", apiRouter);

app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`server on ${PORT}`));
