import { prisma } from "../../config/prisma.js";

// === 사진관 자동완성 검색 API ===
export async function findStudiosByNameKeyword(keyword: string) {
  return prisma.studio.findMany({
    where: {
      name: { contains: keyword },
    },
    select: {
      id: true,
      name: true,
      location: {
        select: { locationCategory: true },
      },
    },
  });
}

export type FindStudiosByNameKeywordResult = Awaited<
  ReturnType<typeof findStudiosByNameKeyword>
>;
