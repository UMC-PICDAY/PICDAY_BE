import { AppError } from "../../common/error.js";

import { extractBearerToken, verifyToken } from "../auth/auth.token.js";
import * as studioSearchRepository from "./studio.search.repository.js";
import {
  createStudioAutocompleteResponse, // 자동완성검색
  parseGetStudioAutocompleteRequest, // 자동완성검색
  createStudioSearchResponse, // 검색 결과 조회
  parseSearchStudiosRequest, // 검색 결과 조회
  parseSearchStudiosByNameRequest, // 이름 검색
  StudioSort, // 검색 결과 조회
} from "./studio.search.dto.js";
import type {
  BannerStudioItem,
  GetHomeResponseDto,
  StudioWithPriceAndRatingItem,
  StudioAutocompleteResponseDto, // 자동완성검색
  RawSearchStudiosRequestDto, // 검색 결과 조회
  RawSearchStudiosByNameRequestDto, // 이름 검색
  StudioSearchResponseDto, // 검색 결과 조회
  StudioSearchResponseInputDto, // 검색 결과 조회
} from "./studio.search.dto.js";
import type { FindStudiosBySearchFiltersResult } from "./studio.search.repository.js";

import { LocationCategory } from "../../generated/prisma/enums.js";

// ========================================================
// ======================== 홈 화면  ========================
// ========================================================

// ===== 상수 ======

// Record : LocationCategory에 있는 모든 값을 key로 가지고, 각 key의 value는 Coordinate 타입
type locationCategoryLatLon = {
  latitude: number;
  longitude: number;
};

const LOCATION_CATEGORY_COORDINATES: Record<
  LocationCategory,
  locationCategoryLatLon
> = {
  HONGDAE: {
    latitude: 37.5563,
    longitude: 126.9236,
  },
  GANGNAM: {
    latitude: 37.4979,
    longitude: 127.0276,
  },
  SEONGSU: {
    latitude: 37.5446,
    longitude: 127.0557,
  },
  YEONNAM: {
    latitude: 37.5658,
    longitude: 126.9236,
  },
  KONDAE: {
    latitude: 37.5404,
    longitude: 127.0692,
  },
  SINCHON: {
    latitude: 37.5596,
    longitude: 126.9424,
  },
  JAMSIL: {
    latitude: 37.5133,
    longitude: 127.1002,
  },
  APGUJEONG: {
    latitude: 37.5271,
    longitude: 127.0287,
  },
  HYEHWA: {
    latitude: 37.5823,
    longitude: 127.0019,
  },
  JONGNO: {
    latitude: 37.5704,
    longitude: 126.9918,
  },
};

// 조회할 스튜디오 개수
const BANNER_STUDIO_COUNT = 10;
const COMMON_STUDIO_COUNT = 6;

// 위치 권한 거부 시, 사진관(regionalStudios)목록을 제공할 지역
// 1) :뒤에 => 타입, 이 변수는 HONGDAE|GANGNAM|...|JONGNO 중 하나만 담을 수 있다
// 2) =뒤에 => 값, LocationCategory 객체에 접근해서 문자열 "HONGDAE"를 꺼내옴
const NEARBY_CATEGORIES_1 = [LocationCategory.HONGDAE];
const NEARBY_CATEGORIES_2 = [
  LocationCategory.HONGDAE,
  LocationCategory.GANGNAM,
];

// ===== 함수 =====

// 1, 공통적으로 사용하는 함수

// 1.1 썸네일 이미지 url(string) 추출
type ProductImageRow = {
  url: string;
  studioThumbnailOrder: number | null;
};

// 파라미터 : products 라는 배열
// 배열 안에는 객체 { ... }가 들어간다. 각 객체는 'productImages'라는 key와 'ProductImageUrl 타입의 배열' value를 가진다.
function pickThumbnail(
  products: Array<{ productImages: ProductImageRow[] }>,
): string | null {
  for (const product of products) {
    if (product.productImages[0]) {
      return product.productImages[0].url;
    }
  }
  return null;
}

// 1.2 MinPrice 추출
function pickMinPrice(products: Array<{ price: number }>): number | null {
  let minPrice: number | null = null;

  for (const product of products) {
    if (minPrice === null || product.price < minPrice) {
      minPrice = product.price;
    }
  }
  return minPrice;
}

// 2. BannerStudioItem 부분 : repository의 prisma 추출 결과 -> DTO 맞춰서 변환

type BannerListRow = {
  // prisma에서 조회한 결과의 타입 정의
  id: bigint;
  name: string;
  location: { locationCategory: string } | null;
  products: Array<{ productImages: ProductImageRow[] }>;
};

function toBannerListItem(studio: BannerListRow): BannerStudioItem {
  // dto로 변환시키는 함수 정의
  return {
    studioId: Number(studio.id),
    studioName: studio.name,
    thumbnailUrl: pickThumbnail(studio.products),
    locationCategory: studio.location?.locationCategory ?? "",
  };
}

// 3.  StudioWithPriceAndRatingItem 부분 : repository의 prisma 추출 결과 -> DTO 맞춰서 변환
type StudioListRow = {
  id: bigint;
  name: string;
  ratingScore: number | null;
  location: { locationCategory: string } | null;
  products: Array<{ price: number; productImages: ProductImageRow[] }>;
};

function toStudioListItem(studio: StudioListRow): StudioWithPriceAndRatingItem {
  return {
    studioId: Number(studio.id),
    studioName: studio.name,
    thumbnailUrl: pickThumbnail(studio.products),
    locationCategory: studio.location?.locationCategory ?? "",
    minPrice: pickMinPrice(studio.products),
    rating: studio.ratingScore ?? 0,
  };
}

// 3.1 사용자 위치 기반 locationCategory의 사진관 목록

// 거리 계산 함수
function calculateDistanceKm(
  userLat: number,
  userLon: number,
  coordinateLat: number,
  coordinateLon: number,
): number {
  const R = 6371; // 지구 반지름(km)
  const dLat = ((coordinateLat - userLat) * Math.PI) / 180;
  const dLon = ((coordinateLon - userLon) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((coordinateLat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 사용자 위치 기반으로 가장 가까운 LocationCategory 찾는 함수
function findNearestLocationCategory(
  userLatitude: number,
  userLongitude: number,
): LocationCategory {
  let nearestCategory: LocationCategory = LocationCategory.HONGDAE;
  let nearestDistance = Infinity;

  for (const [category, coordinate] of Object.entries(
    LOCATION_CATEGORY_COORDINATES,
  ) as [LocationCategory, locationCategoryLatLon][]) {
    const distance = calculateDistanceKm(
      userLatitude,
      userLongitude,
      coordinate.latitude,
      coordinate.longitude,
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestCategory = category;
    }
  }

  return nearestCategory;
}

// 로그인 여부에 따라서 사용할 LocationCategory 결정하는 함수
function resolveHomeLocationCategory(
  latitude?: number,
  longitude?: number,
): LocationCategory {
  if (latitude == null || longitude == null) {
    return LocationCategory.HONGDAE;
  }

  return findNearestLocationCategory(latitude, longitude);
}

// 3.2 Optional Auth 처리

// 1) 로그인 상태일 경우, 요청 예시
// GET /api/v1/home HTTP/1.1
// Host: localhost:3000
// Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJpYXQiOjE3MjAwMDAwMDB9.fake-signature
// Content-Type: application/json

// 2) extractBearerToken(header?: string)함수
// 파라미터 - header
//  = Authorization의 value = "Bearer <token>"
// 리턴 값 -
//   "Bearer "로 시작하는 header가 있다면 -> "Bearer " 이 제거된 token을 리턴
//   header가 없다면 -> null 리턴

// 3) verifyToken(token: string, expectedType: TokenType) 함수
// JWT 토큰이 진짜 유효한 토큰인지 검사하고, 토큰 안에 들어 있는 사용자 정보를 꺼내주는 함수
// - 만료됐으면
//    → access면 AUTH_4017
//    → refresh면 AUTH_4016
//    → signup이면 AUTH_4014

// - 토큰 형식이 이상하거나 서명이 틀렸으면
//    → AUTH_4013

type OptionalUser = {
  userId: bigint | null;
};

function resolveOptionalUser(authorization?: string): OptionalUser {
  if (!authorization) {
    // authorization : Authorization: Bearer <token>
    return { userId: null }; // 상황 1: Authorization 헤더 자체가 없음 → 비로그인
  }

  // Authorization: Bearer <token> 에서 token만 추출
  const token = extractBearerToken(authorization); // token 값 : 로그인 -> <token> 리턴, 비로그인 -> null 리턴

  if (!token) {
    return { userId: null }; // 상황 2: 헤더는 있지만 "Bearer <token>" 형식이 아니거나 토큰이 빈 문자열 → 비로그인
  }

  try {
    const payload = verifyToken(token, "access"); // verifyToken 내부에서 만료/서명 오류/타입 오류를 AppError로 던짐
    return { userId: BigInt(payload.sub) }; // 상황 3: 토큰 검증 성공 → 로그인 사용자
  } catch (error) {
    // 토큰이 만료/무효해도 홈 화면은 에러 없이 비로그인으로 보여줌
    console.log(
      "토큰이 만료되었거나 유효하지 않아 비로그인으로 처리합니다.",
      error,
    );
    return { userId: null }; // 상황 4: 토큰은 있지만 만료/서명오류/타입불일치 → 비로그인
  }
}

// 4. 홈 화면 조회 API
export async function getHome(
  authHeader: string | undefined,
  latitude?: number,
  longitude?: number,
): Promise<GetHomeResponseDto> {
  try {
    const { userId } = resolveOptionalUser(authHeader);
    const locationCategory = resolveHomeLocationCategory(latitude, longitude);

    const [bannerRows, popularRows, regionalRows] = await Promise.all([
      studioSearchRepository.findHighRatedStudios(),
      studioSearchRepository.findPopularStudios(),
      studioSearchRepository.findStudiosByLocationCategory(locationCategory),
    ]);

    // 공통
    const bannerStudios = bannerRows.map(toBannerListItem);
    const popularStudios = popularRows.map(toStudioListItem);
    const regionalStudios = {
      locationCategory,
      studios: regionalRows.map((row) => toStudioListItem(row.studio)),
    };

    // 비로그인 사용자 : 배너 + 인기 사진관 + 위치 기반 사진관
    if (userId === null) {
      return {
        success: true,
        code: "COMMON_200",
        message: "홈 화면 조회에 성공했습니다.",
        data: {
          bannerStudios,
          popularStudios,
          regionalStudios,
        },
      };
    }

    // 로그인 사용자 : 배너 + 최근 본 사진관 + 인기 사진관 + 위치 기반 사진관
    const recentRows =
      await studioSearchRepository.findRecentlyViewedStudios(userId);
    const recentStudios = recentRows.map((view) =>
      toStudioListItem(view.studio),
    );

    return {
      success: true,
      code: "COMMON_200",
      message: "홈 화면 조회에 성공했습니다.",
      data: {
        bannerStudios,
        recentStudios,
        popularStudios,
        regionalStudios,
      },
    };
  } catch (error) {
    console.error("getHome error:", error);

    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("COMMON_500");
  }
}

// ========================================================
// =================== 사진관 검색 자동 완성 ===================
// ========================================================

// UI 표기용 지역 라벨 (studio_location.location_category 기준)
const LOCATION_CATEGORY_LABELS: Record<string, string> = {
  HONGDAE: "홍대",
  GANGNAM: "강남",
  SEONGSU: "성수",
  YEONNAM: "연남",
  KONDAE: "건대",
  SINCHON: "신촌",
  JAMSIL: "잠실",
  APGUJEONG: "압구정",
  HYEHWA: "혜화",
  JONGNO: "종로",
};

// === 사진관 자동완성 검색 API ===
export async function getStudioAutocomplete(
  rawKeyword: string,
): Promise<StudioAutocompleteResponseDto> {
  try {
    const { keyword } = parseGetStudioAutocompleteRequest({
      keyword: rawKeyword,
    });

    const studios =
      await studioSearchRepository.findStudiosByNameKeyword(keyword);

    return createStudioAutocompleteResponse({
      keyword,
      suggestions: studios.map((studio) => {
        const category = studio.location?.locationCategory;

        return {
          studioId: studio.id,
          studioName: studio.name,
          locationCategory: category
            ? (LOCATION_CATEGORY_LABELS[category] ?? category)
            : "",
        };
      }),
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("COMMON_500");
  }
}

// ========================================================
// =================== 사진관 검색 결과 조회 ===================
// ========================================================

// ===== 0. 함수 =====

// 썸네일 이미지 url(string) 2장 추출
type StudioSearchRow = FindStudiosBySearchFiltersResult[number]; // repository 함수 호출

// 카드(스튜디오)당 썸네일 장수
const STUDIO_THUMBNAIL_COUNT = 2;

// 썸네일 URL 목록 (최대 2장)
function pickThumbnails(
  products: Array<{ productImages: ProductImageRow[] }>,
): string[] | null {
  const thumbnails: string[] = [];

  for (const product of products) {
    if (thumbnails.length >= STUDIO_THUMBNAIL_COUNT) {
      break;
    }
    if (product.productImages[0]) {
      thumbnails.push(product.productImages[0].url);
    }
    if (
      thumbnails.length < STUDIO_THUMBNAIL_COUNT &&
      product.productImages[1]
    ) {
      thumbnails.push(product.productImages[1].url);
    }
  }

  return thumbnails.length > 0 ? thumbnails : null; // url이 0개이면 null 리턴
}

function toSearchItemInput(
  studio: StudioSearchRow,
  reviewCountByStudioId: Map<bigint, number>,
  wishlistedStudioIds: Set<bigint>,
): StudioSearchResponseInputDto["studios"][number] {
  const category = studio.location?.locationCategory ?? null;

  return {
    studioId: studio.id,
    studioName: studio.name,
    thumbnailUrls: pickThumbnails(studio.products),
    locationCategory: category,
    latitude: studio.location?.latitude
      ? Number(studio.location.latitude)
      : null,
    longitude: studio.location?.longitude
      ? Number(studio.location.longitude)
      : null,
    minPrice: pickMinPrice(studio.products),
    // ratingScore는 배치가 평균값 그대로(반올림 없이) 저장해두므로, 내보낼 때 소수 첫째 자리로 반올림
    // (wishlist.service.ts/review.service.ts와 동일한 규칙)
    rating: Math.round((studio.ratingScore ?? 0) * 10) / 10,
    reviewCount: reviewCountByStudioId.get(studio.id) ?? 0,
    shootingCategories: [
      ...new Set(studio.products.map((product) => product.shootingCategory)),
    ],
    serviceCodes: studio.studioServices.map((service) => service.serviceCode),
    isWishlisted: wishlistedStudioIds.has(studio.id),
    productSummaries: studio.products.map((product) => ({
      productId: product.id,
      productName: product.name,
      shootingCategory: product.shootingCategory,
      price: product.price,
    })),
  };
}

const SORT_FALLBACK = Number.POSITIVE_INFINITY;

function compareBigintAsc(a: bigint, b: bigint): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

// StudioSort별 정렬. 동률이면 항상 id 오름차순으로 고정해, 정렬 기준을 바꿔도 순서가 안정적이도록 함.
// 추천순/별점순은 배치가 미리 계산해 둔 reservationRank/ratingRank 컬럼을 그대로 쓴다(findPopularStudios/findHighRatedStudios와 동일 기준).
function sortStudioRows(
  rows: StudioSearchRow[],
  reviewCountByStudioId: Map<bigint, number>,
  sort: StudioSort,
): StudioSearchRow[] {
  const sorted = [...rows];

  switch (sort) {
    case StudioSort.PRICE_LOW:
      sorted.sort((a, b) => {
        const priceA = pickMinPrice(a.products) ?? SORT_FALLBACK;
        const priceB = pickMinPrice(b.products) ?? SORT_FALLBACK;
        return priceA !== priceB
          ? priceA - priceB
          : compareBigintAsc(a.id, b.id);
      });
      return sorted;

    case StudioSort.RATING_HIGH:
      sorted.sort((a, b) => {
        const rankA = a.ratingRank ?? SORT_FALLBACK;
        const rankB = b.ratingRank ?? SORT_FALLBACK;
        return rankA !== rankB ? rankA - rankB : compareBigintAsc(a.id, b.id);
      });
      return sorted;

    case StudioSort.REVIEW_COUNT:
      sorted.sort((a, b) => {
        const countA = reviewCountByStudioId.get(a.id) ?? 0;
        const countB = reviewCountByStudioId.get(b.id) ?? 0;
        return countB !== countA
          ? countB - countA
          : compareBigintAsc(a.id, b.id);
      });
      return sorted;

    case StudioSort.RECOMMENDED:
      sorted.sort((a, b) => {
        const rankA = a.reservationRank ?? SORT_FALLBACK;
        const rankB = b.reservationRank ?? SORT_FALLBACK;
        return rankA !== rankB ? rankA - rankB : compareBigintAsc(a.id, b.id);
      });
      return sorted;
  }
}

async function buildSearchResponse(
  filters: studioSearchRepository.StudioSearchFilters,
  sort: StudioSort,
  appliedFilters: StudioSearchResponseInputDto["appliedFilters"],
  userId: bigint | null,
) {
  const rows = await studioSearchRepository.findStudiosBySearchFilters(filters);
  const studioIds = rows.map((row) => row.id);

  const [reviewCountRows, wishlistedStudioIds] = await Promise.all([
    studioSearchRepository.findReviewCountsByStudioIds(studioIds),
    userId
      ? studioSearchRepository.findWishlistedStudioIds(userId, studioIds)
      : Promise.resolve(new Set<bigint>()),
  ]);

  const reviewCountByStudioId = new Map(
    reviewCountRows.map((row) => [row.studioId, row._count._all]),
  );

  const studios = sortStudioRows(rows, reviewCountByStudioId, sort).map((row) =>
    toSearchItemInput(row, reviewCountByStudioId, wishlistedStudioIds),
  );

  return createStudioSearchResponse({
    hasResult: studios.length > 0,
    totalCount: studios.length,
    appliedFilters,
    studios,
  });
}

// === 1. 통합 검색 조회 (위치/날짜/컨셉) ===
export async function searchStudios(
  authHeader: string | undefined,
  rawQuery: RawSearchStudiosRequestDto,
): Promise<StudioSearchResponseDto> {
  try {
    const query = parseSearchStudiosRequest(rawQuery);

    const { userId } = resolveOptionalUser(authHeader);

    return await buildSearchResponse(
      {
        locationCategory: query.locationCategory,
        date: query.dbDate,
        shootingCategories: query.shootingCategory,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        serviceCodes: query.serviceCode,
        minRating: query.minRating,
      },
      query.sort,
      {
        locationCategory: query.locationCategory ?? null,
        date: query.date ?? null,
        shootingCategories: query.shootingCategory ?? [],
        studioName: null,
        sort: query.sort,
        minPrice: query.minPrice ?? null,
        maxPrice: query.maxPrice ?? null,
        serviceCodes: query.serviceCode ?? [],
        minRating: query.minRating ?? null,
      },
      userId,
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("COMMON_500");
  }
}

// === 2. 스튜디오 이름 검색 조회 ===
export async function searchStudiosByName(
  authHeader: string | undefined,
  rawQuery: RawSearchStudiosByNameRequestDto,
): Promise<StudioSearchResponseDto> {
  try {
    const query = parseSearchStudiosByNameRequest(rawQuery);
    const { userId } = resolveOptionalUser(authHeader);

    return await buildSearchResponse(
      {
        studioName: query.studioName,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        serviceCodes: query.serviceCode,
        minRating: query.minRating,
      },
      query.sort,
      {
        locationCategory: null,
        date: null,
        shootingCategories: [],
        studioName: query.studioName,
        sort: query.sort,
        minPrice: query.minPrice ?? null,
        maxPrice: query.maxPrice ?? null,
        serviceCodes: query.serviceCode ?? [],
        minRating: query.minRating ?? null,
      },
      userId,
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("COMMON_500");
  }
}
