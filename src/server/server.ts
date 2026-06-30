import express from "express";
import "dotenv/config";
import { errorHandler } from "../common/errorHandler.js";
import { success } from "../common/response.js";
import authRouter from "../domains/auth/auth.router.js";
import studioRouter from "../domains/studio/studio.router.js";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json(success("ok")));

app.use("/auth", authRouter);
app.use("/studios", studioRouter);

app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`server on ${PORT}`));
