import { Router, type Router as RouterType } from "express";
import * as studioController from "./studio.controller.js";

const router: RouterType = Router();

router.get("/", studioController.getStudios);
router.get("/:id", studioController.getStudioById);
router.post("/", studioController.createStudio);

export default router;
