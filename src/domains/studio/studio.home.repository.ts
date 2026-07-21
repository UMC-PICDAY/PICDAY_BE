import { prisma } from "../../config/prisma.js";

// import type { LocationCategory } from "../../generated/prisma/client.js";
type LocationCategory =
  | "HONGDAE"
  | "GANGNAM"
  | "SEONGSU"
  | "YEONNAM"
  | "KONDAE"
  | "SINCHON"
  | "JAMSIL"
  | "APGUJEONG"
  | "HYEHWA"
  | "JONGNO";

const BANNER_STUDIO_COUNT = 10;
const COMMON_STUDIO_COUNT = 6;

// ======= 리팩토링 필요  =======
// 1. 각 studio 에 해당하는 product 목록은 따로 조회하는 API를 만들어서, studio 조회 시 product 목록은 제외하고, product 조회 API에서 studioId로 조회하도록 변경 필요
// 왜냐하면 스튜디오 단위의 데이터 값은 다 같은데, product의 가격과 이미지 때문에 엄청 많이 중복됨.
// 2. LacationCategory 타입 선언 안하고 위에서 주석처리 된것 처럼 import로 받아오기

// 상단 배너 용 사진관 10개 조회 (평균 평점)
export async function findHighRatedStudios() {
  return prisma.studio.findMany({
    orderBy: { ratingRank: "asc" },
    take: BANNER_STUDIO_COUNT,
    where: { ratingRank: { not: null } },
    select: {
      id: true,
      name: true,
      ratingScore: true,
      studioLocation: {
        select: { locationCategory: true },
      },
      studioProduct: {
        productImage: {
          where: {
            studioThumbnailOrder: { not: null },
          },
          orderBy: {
            studioThumbnailOrder: "asc",
          },
          take: 1,
          select: {
            url: true,
            studioThumbnailOrder: true,
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
                where: { studioThumbnailOrder: { not: null } },
                select: { url: true, studioThumbnailOrder: true },
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
    where: { reservationRank: { not: null } },
    orderBy: { reservationRank: "asc" },
    take: COMMON_STUDIO_COUNT,
    select: {
      id: true,
      name: true,
      ratingScore: true,
      location: { select: { locationCategory: true } },
      products: {
        select: {
          price: true,
          productImages: {
            where: { studioThumbnailOrder: { not: null } },
            select: { url: true, studioThumbnailOrder: true },
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
    orderBy: { studio: { ratingScore: { sort: "desc", nulls: "last" } } },
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
                where: { studioThumbnailOrder: { not: null } },
                select: { url: true, studioThumbnailOrder: true },
              },
            },
          },
        },
      },
    },
  });
}
