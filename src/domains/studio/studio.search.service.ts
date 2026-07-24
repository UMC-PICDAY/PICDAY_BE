import { AppError } from "../../common/error.js";
import { extractBearerToken, verifyToken } from "../auth/auth.token.js";
import * as studioSearchRepository from "./studio.search.repository.js";
import type {
  BannerStudioItem,
  GetHomeResponseDto,
  StudioWithPriceAndRatingItem,
} from "./studio.search.dto.js";

import { LocationCategory } from "../../generated/prisma/enums.js";
import type { ProductImage } from "../../generated/prisma/client.js";

// ♻️ 리팩토링

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

// 2. repository의 prisma 추출 결과 -> DTO 맞춰서 변환

// 2.1 BannerStudioItem 부분
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
    studioId: studio.id.toString(),
    studioName: studio.name,
    thumbnailUrl: pickThumbnail(studio.products),
    locationCategory: studio.location?.locationCategory ?? "",
  };
}

// 2.2 StudioWithPriceAndRatingItem 부분
type StudioListRow = {
  id: bigint;
  name: string;
  ratingScore: number | null;
  location: { locationCategory: string } | null;
  products: Array<{ price: number; productImages: ProductImageRow[] }>;
};

function toStudioListItem(studio: StudioListRow): StudioWithPriceAndRatingItem {
  return {
    studioId: studio.id.toString(),
    studioName: studio.name,
    thumbnailUrl: pickThumbnail(studio.products),
    locationCategory: studio.location?.locationCategory ?? "",
    minPrice: pickMinPrice(studio.products),
    rating: studio.ratingScore ?? 0,
  };
}

// 3. 로그인, 비로그인 구분해서 위의 data 조합

// @Security() 대신 여기서 수동으로 optional auth 처리
// 토큰 없음 = 비로그인(에러 아님), 토큰 있는데 잘못됨/만료 = AppError(AUTH_401x) 그대로 전파
async function resolveOptionalUserId(
  authHeader: string | undefined,
): Promise<bigint | undefined> {
  const token = extractBearerToken(authHeader);
  if (!token) {
    return undefined;
  }

  const payload = verifyToken(token, "access");
  return BigInt(payload.sub);
}

async function getRecentOrNearbyStudios(
  userId: bigint | undefined,
): Promise<StudioWithPriceAndRatingItem[]> {
  if (userId !== undefined) {
    const views =
      await studioSearchRepository.findRecentlyViewedStudios(userId);
    return views.map((view) => toStudioListItem(view.studio));
  }

  const nearby = await Promise.all(
    NEARBY_CATEGORIES.map((category) =>
      studioSearchRepository.findStudiosByLocationCategory(category),
    ),
  );

  return nearby
    .flat()
    .map((row) => toStudioListItem(row.studio))
    .slice(0, RESULT_LIMIT);
}

export async function getHome(
  authHeader: string | undefined,
): Promise<GetHomeResponseDto> {
  try {
    const userId = await resolveOptionalUserId(authHeader);

    const [bannerStudios, popularStudios, regionalStudioRows, recentStudios] =
      await Promise.all([
        studioSearchRepository.findHighRatedStudios(),
        studioSearchRepository.findPopularStudios(),
        studioSearchRepository.findStudiosByLocationCategory(REGIONAL_CATEGORY),
        getRecentOrNearbyStudios(userId),
      ]);

    return {
      bannerStudios: bannerStudios.map(toBannerItem),
      recentStudios,
      popularStudios: popularStudios.map(toStudioListItem),
      regionalStudios: {
        locationCategory: toLocationLabel(REGIONAL_CATEGORY),
        studios: regionalStudioRows
          .map((row) => toStudioListItem(row.studio))
          .slice(0, RESULT_LIMIT),
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("COMMON_500");
  }
}
