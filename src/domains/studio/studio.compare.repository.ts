import { prisma } from "../../config/prisma.js";
import type { ShootingCategory } from "../../generated/prisma/enums.js";

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

// 비교 대상 사진관 + 선택 촬영 목적의 상품/부가 정보 조회.
// products는 가격 오름차순 → id 오름차순으로 정렬해서 반환하므로,
// products[0]이 곧 "대표 상품"(최저가, 동가면 최소 id)이 된다.
// products가 빈 배열이면 해당 사진관이 그 shootingCategory를 지원하지 않는다는 뜻.
export async function findStudiosForCompareResult(
  studioIds: bigint[],
  shootingCategory: ShootingCategory,
) {
  return prisma.studio.findMany({
    where: { id: { in: studioIds } },
    select: {
      id: true,
      name: true,
      location: {
        select: {
          locationCategory: true,
          nearestStation: true,
          walkingMinutes: true,
        },
      },
      studioServices: {
        orderBy: { serviceCode: "asc" },
        select: { serviceCode: true },
      },
      products: {
        where: { shootingCategory },
        orderBy: [{ price: "asc" }, { id: "asc" }],
        select: {
          id: true,
          price: true,
          comparisonSummary: true,
          hasAdditionalPrice: true,
          productImages: {
            orderBy: { order: "asc" },
            take: 1,
            select: { url: true },
          },
        },
      },
    },
  });
}

// 사진관별 리뷰 평점 평균 / 개수 집계
export async function findReviewSummariesByStudioIds(studioIds: bigint[]) {
  return prisma.review.groupBy({
    by: ["studioId"],
    where: { studioId: { in: studioIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });
}

// 오늘(당일 포함) 이후 예약 가능한 시간 슬롯 후보를 다 가져온다.
// "이미 시작된 슬롯"인지는 date + startTime을 합쳐야 정확히 판단 가능하므로
// (date만으로는 당일 슬롯이 이미 지났는지 구분 불가) 서비스 레이어에서
// studio별로 순회하며 최종 필터링한다.
export async function findAvailableTimeSlotCandidates(
  studioIds: bigint[],
  fromDate: Date,
) {
  return prisma.timeSlot.findMany({
    where: {
      studioId: { in: studioIds },
      isAvailable: true,
      date: { gte: fromDate },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    select: {
      studioId: true,
      date: true,
      startTime: true,
    },
  });
}