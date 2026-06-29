import { prisma } from "../../config/prisma.js";

export async function findAllStudios() {
  // TODO: Studio 모델 추가 후 구현
  void prisma;
  return [];
}

export async function findStudioById(id: string) {
  // TODO: Studio 모델 추가 후 구현
  void id;
  void prisma;
  return null;
}

export async function createStudio(_data: {
  name: string;
  description?: string | undefined;
  address: string;
}) {
  // TODO: Studio 모델 추가 후 구현
  return null;
}
