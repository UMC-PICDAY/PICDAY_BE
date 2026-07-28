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

// ======= 리팩토링 필요?  =======
// 1. 각 studio 에 해당하는 product 목록은 따로 조회하는 API를 만들어서, studio 조회 시 product 목록은 제외하고, product 조회 API에서 studioId로 조회하도록 변경 필요
// 왜냐하면 스튜디오 단위의 데이터 값은 다 같은데, product의 가격과 이미지 때문에 엄청 많이 중복됨.

// 상단 배너 용 사진관 10개 조회 (평균 평점)
export async function findHighRatedStudios() {
  return prisma.studio.findMany({
    orderBy: [{ ratingRank: { sort: "asc", nulls: "last" } }, { id: "asc" }],
    take: BANNER_STUDIO_COUNT,

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
  });
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
  return prisma.studio.findMany({
    orderBy: [
      { reservationRank: { sort: "asc", nulls: "last" } },
      { id: "asc" },
    ],
    take: BANNER_STUDIO_COUNT,
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
  });
}
export type FindPopularStudiosResult = Awaited<
  ReturnType<typeof findPopularStudios>
>;

// === locationCategory 별 사진관 조회 ===
export async function findStudiosByLocationCategory(
  location: LocationCategory,
) {
  return prisma.studioLocation.findMany({
    where: { locationCategory: location },
    orderBy: [
      {
        studio: {
          ratingRank: {
            sort: "asc",
            nulls: "last",
          },
        },
      },
      {
        studio: {
          id: "asc",
        },
      },
    ],
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
  studioName?: string | undefined;
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
      ...(filters.studioName && { name: { contains: filters.studioName } }),
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
      ratingRank: true,
      reservationCount: true,
      reservationRank: true,
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
