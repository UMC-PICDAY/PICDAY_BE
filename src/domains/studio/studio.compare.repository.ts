import { prisma } from "../../config/prisma.js";

// 비교 대상 사진관들의 이름과, 각 사진관이 보유한 StudioProduct의
// shootingCategory 목록을 함께 조회한다.
// 존재하지 않는 사진관이 있는지는 서비스 레이어에서
// (조회된 개수 !== 요청한 개수)로 판정한다.
export async function findStudiosForCompare(studioIds: bigint[]) {
  return prisma.studio.findMany({
    where: { id: { in: studioIds } },
    select: {
      id: true,
      name: true,
      products: {
        select: { shootingCategory: true },
      },
    },
  });
}