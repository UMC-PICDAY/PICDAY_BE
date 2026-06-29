import type { NextFunction, Request, Response } from "express";
import { success } from "../../common/response.js";
import * as authService from "./auth.service.js";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}
