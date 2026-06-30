import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/error.js";
import { HTTP_STATUS } from "../../common/constants.js";
import { success } from "../../common/response.js";
import * as studioService from "./studio.service.js";

export async function getStudios(_req: Request, res: Response, next: NextFunction) {
  try {
    const studios = await studioService.getStudios();
    res.json(success(studios));
  } catch (err) {
    next(err);
  }
}

export async function getStudioById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, "Invalid studio id");
    }
    const studio = await studioService.getStudioById(id);
    res.json(success(studio));
  } catch (err) {
    next(err);
  }
}

export async function createStudio(req: Request, res: Response, next: NextFunction) {
  try {
    const studio = await studioService.createStudio(req.body);
    res.status(201).json(success(studio));
  } catch (err) {
    next(err);
  }
}
