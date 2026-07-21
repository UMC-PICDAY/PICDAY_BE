import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import fs from "node:fs";
import path from "node:path";

export function setupSwagger(app: Express): void {
  const swaggerDocumentPath = path.resolve(process.cwd(), "dist/swagger.json");
  const swaggerDocument = JSON.parse(fs.readFileSync(swaggerDocumentPath, "utf-8"));

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}