import { prisma } from "../../config/prisma.js";

// ========================================================
// ======================== 홈 화면  ========================
// ========================================================

import type {
  LocationCategory,
  ServiceCode,
  ShootingCategory,
} from "../../generated/prisma/enums.js";
import type { Prisma } from "../../generated/prisma/client.js";
//   | "HONGDAE"
//   | "GANGNAM"
//   | "SEONGSU"
//   | "YEONNAM"
//   | "KONDAE"
//   | "SINCHON"
//   | "JAMSIL"
//   | "APGUJEONG"
//   | "HYEHWA"
//   | "JONGNO";

const BANNER_STUDIO_COUNT = 10;
const COMMON_STUDIO_COUNT = 6;

// 정렬 기준 값(rank)이 없는 스튜디오를 정렬 시 맨 뒤로 보내기 위한 값
const RANK_FALLBACK = Number.POSITIVE_INFINITY;

function compareBigintAsc(a: bigint, b: bigint): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

// ======= 리팩토링 필요?  =======
// 1. 각 studio 에 해당하는 product 목록은 따로 조회하는 API를 만들어서, studio 조회 시 product 목록은 제외하고, product 조회 API에서 studioId로 조회하도록 변경 필요
// 왜냐하면 스튜디오 단위의 데이터 값은 다 같은데, product의 가격과 이미지 때문에 엄청 많이 중복됨.

// 배치가 studio_daily_stats를 채운 가장 최근 statDate 조회 (배치 미실행/데이터 없음 → null)
async function getLatestStatDate(): Promise<Date | null> {
  const latest = await prisma.studioDailyStats.findFirst({
    orderBy: { statDate: "desc" },
    select: { statDate: true },
  });
  return latest?.statDate ?? null;
}

// 상단 배너 용 사진관 10개 조회 (평균 평점 순위)
export async function findHighRatedStudios() {
  const latestStatDate = await getLatestStatDate();
  if (!latestStatDate) {
    return [];
  }

  // 그 날짜의 평점 순위(ratingRank) 상위 10개를, relation을 통해 studio 데이터까지 한 번에 조회
  // (studioDailyStats.findMany의 orderBy 순서가 그대로 유지되므로 재정렬이 필요 없음)
  const rankedStats = await prisma.studioDailyStats.findMany({
    where: { statDate: latestStatDate },
    orderBy: [{ ratingRank: "asc" }, { studioId: "asc" }],
    take: BANNER_STUDIO_COUNT,
    select: {
      studio: {
        select: {
          id: true,
          name: true,
          ratingScore: true,
          location: { select: { locationCategory: true } },
          products: {
            select: {
              productImages: {
                // studioThumbnailImage
                orderBy: [
                  { studioThumbnailOrder: { sort: "asc", nulls: "last" } },
                  { id: "asc" },
                ],
                take: 1,
                select: {
                  url: true,
                  studioThumbnailOrder: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return rankedStats.map((stat) => stat.studio);
}

export type FindHighRatedStudiosResult = Awaited<
  ReturnType<typeof findHighRatedStudios>
>;

// 최근 본 사진관 조회 (로그인 기준)
export async function findRecentlyViewedStudios(userId: bigint) {
  return prisma.recentStudioView.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    take: COMMON_STUDIO_COUNT,
    select: {
      studio: {
        select: {
          id: true,
          name: true,
          ratingScore: true,
          location: { select: { locationCategory: true } },
          products: {
            select: {
              price: true,
              productImages: {
                // studioThumbnailImage
                orderBy: [
                  { studioThumbnailOrder: { sort: "asc", nulls: "last" } },
                  { id: "asc" },
                ],
                take: 1,
                select: {
                  url: true,
                  studioThumbnailOrder: true,
                },
              },
            },
          },
        },
      },
    },
  });
}
export type FindRecentlyViewedStudiosResult = Awaited<
  ReturnType<typeof findRecentlyViewedStudios>
>;

// === 인기 사진관 조회 (예약완료건수 랭킹 순) ===
export async function findPopularStudios() {
  const latestStatDate = await getLatestStatDate();
  if (!latestStatDate) {
    return [];
  }

  const rankedStats = await prisma.studioDailyStats.findMany({
    where: { statDate: latestStatDate },
    orderBy: [{ reservationRank: "asc" }, { studioId: "asc" }],
    take: BANNER_STUDIO_COUNT,
    select: {
      studio: {
        select: {
          id: true,
          name: true,
          ratingScore: true,
          location: { select: { locationCategory: true } },
          products: {
            select: {
              price: true,
              productImages: {
                orderBy: [
                  { studioThumbnailOrder: { sort: "asc", nulls: "last" } },
                  { id: "asc" },
                ],
                take: 1,
                select: {
                  url: true,
                  studioThumbnailOrder: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return rankedStats.map((stat) => stat.studio);
}
export type FindPopularStudiosResult = Awaited<
  ReturnType<typeof findPopularStudios>
>;

// === locationCategory 별 사진관 조회 ===
// "상위 N개"가 아니라 그 지역의 모든 스튜디오를 반환 → 순위 데이터 없는 스튜디오도 (맨 뒤로) 포함해야 함
export async function findStudiosByLocationCategory(
  location: LocationCategory,
) {
  // latestStatDate가 없으면(배치 미실행) 존재할 수 없는 날짜를 넣어 dailyStats가 항상 빈 배열로 조회되게 함
  const latestStatDate = (await getLatestStatDate()) ?? new Date(0);

  const rows = await prisma.studioLocation.findMany({
    where: { locationCategory: location },
    select: {
      studioId: true,
      studio: {
        select: {
          id: true,
          name: true,
          ratingScore: true,
          location: { select: { locationCategory: true } },
          products: {
            select: {
              price: true,
              productImages: {
                orderBy: [
                  { studioThumbnailOrder: { sort: "asc", nulls: "last" } },
                  { id: "asc" },
                ],
                select: {
                  url: true,
                  studioThumbnailOrder: true,
                },
              },
            },
          },
          // relation을 통해 이 스튜디오의 최신 평점 순위만 함께 조회 (없으면 빈 배열)
          dailyStats: {
            where: { statDate: latestStatDate },
            select: { ratingRank: true },
          },
        },
      },
    },
  });

  // 순위 데이터가 없는 스튜디오(배치 미반영된 신규 스튜디오 등)는 RANK_FALLBACK으로 맨 뒤로 정렬
  return [...rows].sort((a, b) => {
    const rankA = a.studio.dailyStats[0]?.ratingRank ?? RANK_FALLBACK;
    const rankB = b.studio.dailyStats[0]?.ratingRank ?? RANK_FALLBACK;
    return rankA !== rankB
      ? rankA - rankB
      : compareBigintAsc(a.studioId, b.studioId);
  });
}

// ========================================================
// =================== 사진관 검색 자동 완성 ===================
// ========================================================

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

// ========================================================
// =================== 사진관 검색 결과 조회 ===================
// ========================================================

// 검색 결과 카드의 isWishlisted 계산 (studio.search에서 사용)
export async function findWishlistedStudioIds(
  userId: bigint,
  studioIds: bigint[],
): Promise<Set<bigint>> {
  if (studioIds.length === 0) {
    return new Set();
  }

  const wishlists = await prisma.wishlist.findMany({
    where: { userId, studioId: { in: studioIds } },
    select: { studioId: true },
  });

  return new Set(wishlists.map((wishlist) => wishlist.studioId));
}

export type StudioSearchFilters = {
  locationCategory?: LocationCategory | undefined;
  date?: Date | undefined;
  shootingCategories?: ShootingCategory[] | undefined;
  studioId?: bigint | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  serviceCodes?: ServiceCode[] | undefined;
  minRating?: number | undefined;
};

// 통합 검색/이름 검색이 공유하는 필터 조회 쿼리.
// shootingCategories/가격 조건은 둘 다 products에 대한 "존재" 조건이지만 서로 다른 목적이라,
// where.products에 한 번에 합치면 뒤 스프레드가 앞 조건을 덮어쓴다.
// 그래서 AND 배열의 개별 항목으로 나눠 두 조건이 각각 최소 1개 상품에 매칭되도록 한다.
export async function findStudiosBySearchFilters(filters: StudioSearchFilters) {
  const productConditions: Prisma.StudioProductWhereInput[] = [];

  if (filters.shootingCategories?.length) {
    productConditions.push({
      shootingCategory: { in: filters.shootingCategories },
    });
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    productConditions.push({
      price: {
        ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
        ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
      },
    });
  }

  return prisma.studio.findMany({
    where: {
      ...(filters.studioId !== undefined && { id: filters.studioId }),
      ...(filters.locationCategory && {
        location: { locationCategory: filters.locationCategory },
      }),
      ...(filters.date && {
        timeSlots: { some: { date: filters.date, isAvailable: true } },
      }),
      ...(filters.serviceCodes?.length && {
        studioServices: { some: { serviceCode: { in: filters.serviceCodes } } },
      }),
      ...(filters.minRating !== undefined && {
        ratingScore: { gte: filters.minRating },
      }),
      ...(productConditions.length > 0 && {
        AND: productConditions.map((condition) => ({
          products: { some: condition },
        })),
      }),
    },
    select: {
      id: true,
      name: true,
      ratingScore: true,
      location: {
        select: { locationCategory: true, latitude: true, longitude: true },
      },
      products: {
        select: {
          id: true,
          name: true,
          shootingCategory: true,
          price: true,
          productImages: {
            orderBy: [
              { studioThumbnailOrder: { sort: "asc", nulls: "last" } },
              { id: "asc" },
            ],
            take: 2,
            select: { url: true, studioThumbnailOrder: true },
          },
        },
      },
      studioServices: { select: { serviceCode: true } },
    },
  });
}

export type FindStudiosBySearchFiltersResult = Awaited<
  ReturnType<typeof findStudiosBySearchFilters>
>;

// 검색 결과 카드용 스튜디오별 평점/예약 순위 조회 (정렬 전용, findReviewCountsByStudioIds와 같은 용도)
export async function findStudioDailyStatsByStudioIds(studioIds: bigint[]) {
  if (studioIds.length === 0) {
    return [];
  }

  const latestStatDate = await getLatestStatDate();
  if (!latestStatDate) {
    return [];
  }

  return prisma.studioDailyStats.findMany({
    where: { statDate: latestStatDate, studioId: { in: studioIds } },
    select: { studioId: true, ratingRank: true, reservationRank: true },
  });
}

// ========================================================
// ==================== 최근 본 사진관 저장 ====================
// ========================================================

// 사진관 존재 여부 확인 (404 STUDIO_4041 판단용)
export async function existsStudioById(studioId: bigint): Promise<boolean> {
  const studio = await prisma.studio.findUnique({
    where: { id: studioId },
    select: { id: true },
  });

  return studio !== null;
}

// 조회 기록이 있으면 viewedAt만 최신 시간으로 갱신, 없으면 새로 생성 (userId+studioId 유니크 제약 이용)
export async function upsertRecentStudioView(userId: bigint, studioId: bigint) {
  return prisma.recentStudioView.upsert({
    where: {
      userId_studioId: { userId, studioId },
    },
    update: {
      viewedAt: new Date(),
    },
    create: {
      userId,
      studioId,
    },
    select: {
      studioId: true,
      viewedAt: true,
    },
  });
}

// 검색 결과 카드용 스튜디오별 리뷰 건수 집계 (검색 기능 전용, 다른 도메인 의존성 없이 자체 보유)
export async function findReviewCountsByStudioIds(studioIds: bigint[]) {
  if (studioIds.length === 0) {
    return [];
  }

  return prisma.review.groupBy({
    by: ["studioId"],
    where: { studioId: { in: studioIds } },
    _count: { _all: true },
  });
}

const RECOMMEND_STUDIO_COUNT = 6;

// 검색 결과 없음 화면의 "이런 사진관은 어때요?" 추천 목록.
// 검색 조건과 무관하게, 리뷰 많은순 상위 6개 스튜디오를 뽑는다.
export async function findRecommendedStudios() {
  const topReviewCounts = await prisma.review.groupBy({
    by: ["studioId"],
    _count: { _all: true },
    orderBy: { _count: { studioId: "desc" } },
    take: RECOMMEND_STUDIO_COUNT,
  });

  const studioIds = topReviewCounts.map((row) => row.studioId);

  if (studioIds.length === 0) {
    return [];
  }

  const studios = await prisma.studio.findMany({
    where: { id: { in: studioIds } },
    select: {
      id: true,
      name: true,
      ratingScore: true,
      location: { select: { locationCategory: true } },
      products: {
        select: {
          price: true,
          shootingCategory: true,
          productImages: {
            orderBy: [
              { studioThumbnailOrder: { sort: "asc", nulls: "last" } },
              { id: "asc" },
            ],
            take: 1,
            select: { url: true, studioThumbnailOrder: true },
          },
        },
      },
    },
  });

  // where...in은 studioIds 배열 순서를 보장하지 않으므로, topReviewCounts에서
  // 정해진 "리뷰 많은순" 순서를 기준으로 다시 정렬한다.
  const studioById = new Map(studios.map((studio) => [studio.id, studio]));

  return studioIds
    .map((id) => studioById.get(id))
    .filter(
      (studio): studio is (typeof studios)[number] => studio !== undefined,
    );
}

export type FindRecommendedStudiosResult = Awaited<
  ReturnType<typeof findRecommendedStudios>
>;
