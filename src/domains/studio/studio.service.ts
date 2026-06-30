import { AppError } from "../../common/error.js";
import { HTTP_STATUS } from "../../common/constants.js";
import { createStudioSchema } from "./studio.dto.js";
import * as studioRepository from "./studio.repository.js";

export async function getStudios() {
  return studioRepository.findAllStudios();
}

export async function getStudioById(id: string) {
  const studio = await studioRepository.findStudioById(id);
  if (!studio) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, "Studio not found");
  }
  return studio;
}

export async function createStudio(body: unknown) {
  const parsed = createStudioSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, parsed.error.message);
  }

  const studio = await studioRepository.createStudio(parsed.data);
  if (!studio) {
    throw new AppError(
      HTTP_STATUS.NOT_IMPLEMENTED,
      "Studio creation not implemented yet",
    );
  }

  return studio;
}
