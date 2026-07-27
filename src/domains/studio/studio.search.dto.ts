// ========================================================
// ======================== 홈 화면  ========================
// ========================================================
export type BannerStudioItem = {
  studioId: number;
  studioName: string;
  thumbnailUrl: string | null;
  locationCategory: string;
};

export type StudioWithPriceAndRatingItem = BannerStudioItem & {
  minPrice: number | null;
  rating: number;
};

// ======== 홈 화면 조회 API 응답 타입 ========

// 1. 홈 화면 조회 API 응답 data 타입
export type GetHomeResponseDtoForLogged = {
  bannerStudios: BannerStudioItem[];
  recentStudios: StudioWithPriceAndRatingItem[];
  popularStudios: StudioWithPriceAndRatingItem[];
  regionalStudios: {
    locationCategory: string;
    studios: StudioWithPriceAndRatingItem[];
  };
};

export type GetHomeResponseDtoForNotLogged = {
  bannerStudios: BannerStudioItem[];
  popularStudios: StudioWithPriceAndRatingItem[];
  regionalStudios: {
    locationCategory: string;
    studios: StudioWithPriceAndRatingItem[];
  };
};

// 2. 홈 화면 조회 API 응답 타입
export type GetHomeSuccessResponseDtoForLogged = {
  success: true;
  code: "COMMON_200";
  message: string;
  data: GetHomeResponseDtoForLogged;
};

export type GetHomeSuccessResponseDtoForNotLogged = {
  success: true;
  code: "COMMON_200";
  message: string;
  data: GetHomeResponseDtoForNotLogged;
};

export type GetHomeResponseDto =
  GetHomeSuccessResponseDtoForLogged | GetHomeSuccessResponseDtoForNotLogged;

// ========================================================
// =================== 사진관 검색 자동 완성 ===================
// ========================================================

import { z } from "zod";
import {
  LocationCategory,
  ServiceCode,
  ShootingCategory,
} from "../../generated/prisma/enums.js";
import { toApiId } from "../../common/apiId.js";
import { AppError } from "../../common/error.js";
import type { ErrorCodeType } from "../../common/errorCode.js";

// 사진관 자동완성 검색 API
export const getStudioAutocompleteRequestSchema = z.object({
  keyword: z.string(),
});

export type GetStudioAutocompleteRequestDto = {
  keyword: string;
};

export type GetStudioAutocompleteQuery = z.output<
  typeof getStudioAutocompleteRequestSchema
>;

export function parseGetStudioAutocompleteRequest(
  input: GetStudioAutocompleteRequestDto,
): GetStudioAutocompleteQuery {
  return getStudioAutocompleteRequestSchema.parse(input);
}

// 사진관 자동완성 검색 응답
export const studioAutocompleteSuggestionSchema = z.object({
  studioId: z.bigint().transform((id) => Number(id)),
  studioName: z.string(),
  locationCategory: z.string(),
});

export type StudioAutocompleteSuggestionInputDto = z.input<
  typeof studioAutocompleteSuggestionSchema
>;

export const studioAutocompleteResponseSchema = z.object({
  keyword: z.string(),
  suggestions: z.array(studioAutocompleteSuggestionSchema),
});

export type StudioAutocompleteResponseInputDto = z.input<
  typeof studioAutocompleteResponseSchema
>;

export type StudioAutocompleteResponseDto = z.output<
  typeof studioAutocompleteResponseSchema
>;

export function createStudioAutocompleteResponse(
  input: StudioAutocompleteResponseInputDto,
): StudioAutocompleteResponseDto {
  return studioAutocompleteResponseSchema.parse(input);
}

// =======================================================================
// =================== 사진관 검색 결과 조회 - 요청 (통합 검색) ===================
// =======================================================================

// ======== 요청 데이터 검증 · 전처리 ========
// (여기부터 "공통 응답 DTO" 전까지: 쿼리로 들어온 값들이 올바른지 검사하고,
//  통과하면 서비스/리포지토리가 바로 쓸 수 있는 형태로 다듬는 부분)

// 0. 상수
export enum StudioSort {
  RECOMMENDED = "RECOMMENDED",
  PRICE_LOW = "PRICE_LOW",
  RATING_HIGH = "RATING_HIGH",
  REVIEW_COUNT = "REVIEW_COUNT",
}

const MIN_RATING_OPTIONS = [0, 4, 4.5, 4.8] as const; // UI 버튼 값 : 전체/4.0/4.5/4.8

// UI에 WIFI 필터 버튼이 없음. WIFI를 보내도 에러는 아니지만(z.enum(ServiceCode)는 그대로 통과),
// 실제 검색 조건에는 반영하지 않고 조용히 무시함 — HAIR_MAKEUP/PARKING/COSTUME만 검색에 사용.
const SEARCHABLE_SERVICE_CODES: ServiceCode[] = [
  ServiceCode.HAIR_MAKEUP,
  ServiceCode.PARKING,
  ServiceCode.COSTUME,
];

// 1. "YYYY-MM-DD" 문자열 -> Date 객체(JS Date 인스턴스) 변환 함수
// 사용자가 쿼리로 보낸 문자열 → DB 쿼리에 쓸 수 있는 Date 객체(TimeSlot의 date 컬럼)
export function toDbDate(dateText: string) {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(0);

  date.setUTCFullYear(year!, month! - 1, day!);

  return date; // 2026-07-27T00:00:00.000Z
}

// 2. STUDIO_40010 : 과거 날짜는 검색할 수 없습니다
// 오늘(KST) 날짜 문자열과 요청받은 date를 문자열끼리 비교해서(YYYY-MM-DD라 사전식 비교 = 날짜 비교),
const KST_OFFSET_MILLISECONDS = 9 * 60 * 60 * 1000;

function formatDatePart(value: number) {
  return value.toString().padStart(2, "0");
}

export function getKstDateTime(now: Date) {
  const shifted = new Date(now.getTime() + KST_OFFSET_MILLISECONDS);

  return {
    dateText: `${shifted.getUTCFullYear()}-${formatDatePart(
      shifted.getUTCMonth() + 1,
    )}-${formatDatePart(shifted.getUTCDate())}`,
    secondsSinceMidnight:
      shifted.getUTCHours() * 60 * 60 +
      shifted.getUTCMinutes() * 60 +
      shifted.getUTCSeconds(),
  };
}

function isPastDate(dateText: string): void {
  const kstNow = getKstDateTime(new Date());

  if (dateText < kstNow.dateText) {
    throw new AppError("STUDIO_40010");
  }
}

// 3. STUDIO_4004(날짜 형식이 올바르지 않습니다)
// - "YYYY-MM-DD" 형식이 아니거나
// - 형식은 맞아도 실제로 존재하지 않는 날짜면(예: "2024-02-30")

const datePattern = /^\d{4}-\d{2}-\d{2}$/; // "YYYY-MM-DD" 인 정규식

function isRealDateFormat(dateText: string): void {
  if (!datePattern.test(dateText)) {
    throw new AppError("STUDIO_4004");
  }

  const [year, month, day] = dateText.split("-").map(Number);
  const date = toDbDate(dateText);

  const isReal =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month! - 1 &&
    date.getUTCDate() === day;

  if (!isReal) {
    throw new AppError("STUDIO_4004");
  }
}

// 4. STUDIO_4003 : minPrice > maxPrice
function isMinPriceBigThanMaxPrice(minPrice?: number, maxPrice?: number): void {
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new AppError("STUDIO_4003");
  }
}

// ======== 통합 검색 조회 (위치/날짜/컨셉)의 요청 타입 ========

// 1. raw 입력 : // service.ts에서 호출되는 parseSearchStudioRequest의 인풋 타입
export type RawSearchStudiosRequestDto = {
  locationCategory?: string | undefined;
  date?: string | undefined;
  shootingCategory?: string[] | undefined;
  sort?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  serviceCode?: string[] | undefined;
  minRating?: number | undefined;
};

// 2. 기본적인 raw 입력의 타입 검증
export const searchStudiosRequestSchema = z
  .object({
    locationCategory: z.enum(LocationCategory).optional(),
    date: z.string().optional(), //  + isRealDateFormat (STUDIO_4004)
    shootingCategory: z.array(z.enum(ShootingCategory)).optional(),
    sort: z.enum(StudioSort).default(StudioSort.RECOMMENDED),
    minPrice: z.number().int().nonnegative().optional(), //  + isMinPriceBigThanMaxPrice (STUDIO_4003)
    maxPrice: z.number().int().nonnegative().optional(),
    serviceCode: z.array(z.enum(ServiceCode)).optional(),
    minRating: z.literal(MIN_RATING_OPTIONS).optional(), // STUDIO_4003 : 전체(0)/4.0/4.5/4.8만 허용
  })
  .transform((data) => ({
    ...data,
    dbDate: data.date ? toDbDate(data.date) : undefined,
    serviceCode: data.serviceCode?.filter((code) =>
      SEARCHABLE_SERVICE_CODES.includes(code),
    ),
  }));

const SEARCH_STUDIOS_FIELD_ERROR: Record<string, ErrorCodeType> = {
  locationCategory: "STUDIO_4008",
  shootingCategory: "STUDIO_4007",
  serviceCode: "STUDIO_4009",
  date: "STUDIO_4004",
  sort: "STUDIO_40014",
  minPrice: "STUDIO_4003",
  maxPrice: "STUDIO_4003",
  minRating: "STUDIO_4003",
};

// 3. service.ts에서 호출되는 parseSearchStudioRequest의 리턴 타입
export type SearchStudiosQuery = z.output<typeof searchStudiosRequestSchema>;

// 4. service.ts에서 호출되는 parseSearchStudioRequest 함수
// raw 입력값을 받아서,
// 검증 통과하면 이후 코드가 안심하고 쓸 수 있는 깔끔한 타입의 객체 리턴
// 실패하면 에러코드를 던짐
export function parseSearchStudiosRequest(
  input: RawSearchStudiosRequestDto,
): SearchStudiosQuery {
  const result = searchStudiosRequestSchema.safeParse(input); // zod 로 기본적인 타입 검증

  if (!result.success) {
    const field = result.error.issues[0]?.path[0];
    const code =
      typeof field === "string" ? SEARCH_STUDIOS_FIELD_ERROR[field] : undefined;
    throw new AppError(code ?? "COMMON_400");
  }

  const query = result.data;

  // STUDIO_40012 : location, date, shootingCategory 중 최소 1개는 있어야 함
  if (
    !query.locationCategory &&
    !query.date &&
    !query.shootingCategory?.length
  ) {
    throw new AppError("STUDIO_40012");
  }

  // STUDIO_4004 : date 형식(YYYY-MM-DD)이고, 실제 존재하는 날짜
  // STUDIO_40010 : 그 날짜가 오늘(KST)보다 과거면 안 됨
  if (query.date !== undefined) {
    isRealDateFormat(query.date);
    isPastDate(query.date);
  }

  // STUDIO_4003
  isMinPriceBigThanMaxPrice(query.minPrice, query.maxPrice);

  return query;
}

// ======================================================================
// ============== 사진관 검색 결과 조회 - 요청 (스튜디오 이름 검색) ================
// ======================================================================

// export const searchStudiosByNameRequestSchema = z.object({
//   studioName: z.string().min(1, "스튜디오 이름을 입력해 주세요."),
//   sort: z.enum(StudioSort).default(StudioSort.RECOMMENDED),
//   minPrice: z.number().int().nonnegative().optional(),
//   maxPrice: z.number().int().nonnegative().optional(),
//   serviceCode: z.array(z.enum(ServiceCode)).optional(),
//   minRating: z.literal(MIN_RATING_OPTIONS).optional(),
// });

// export type SearchStudiosByNameQuery = z.output<
//   typeof searchStudiosByNameRequestSchema
// >;

// export type RawSearchStudiosByNameRequestDto = {
//   studioName: string;
//   sort?: string | undefined;
//   minPrice?: number | undefined;
//   maxPrice?: number | undefined;
//   serviceCode?: string[] | undefined;
//   minRating?: number | undefined;
// };

// const SEARCH_STUDIOS_BY_NAME_FIELD_ERROR: Record<string, ErrorCodeType> = {
//   studioName: "COMMON_400",
//   serviceCode: "STUDIO_4009",
//   sort: "STUDIO_40014",
//   minPrice: "STUDIO_4003",
//   maxPrice: "STUDIO_4003",
//   minRating: "STUDIO_4003",
// };

// export function parseSearchStudiosByNameRequest(
//   input: RawSearchStudiosByNameRequestDto,
// ): SearchStudiosByNameQuery {
//   const result = searchStudiosByNameRequestSchema.safeParse(input);

//   if (!result.success) {
//     const field = result.error.issues[0]?.path[0];
//     const code =
//       typeof field === "string"
//         ? SEARCH_STUDIOS_BY_NAME_FIELD_ERROR[field]
//         : undefined;
//     throw new AppError(code ?? "COMMON_400");
//   }

//   isMinPriceBigThanMaxPrice(result.data.minPrice, result.data.maxPrice);

//   return result.data;
// }

// ================================================================
// ================= 사진관 검색 결과 조회 - 응답 DTO ===================
// ================================================================
//
// // 통합 검색 / 이름 검색 둘 다 이 형태로 응답

const studioSearchProductSummarySchema = z.object({
  productId: z.bigint().transform(toApiId),
  productName: z.string(),
  shootingCategory: z.enum(ShootingCategory),
  price: z.number().int().nonnegative(),
});

export const studioSearchItemSchema = z.object({
  studioId: z.bigint().transform(toApiId),
  studioName: z.string(),
  thumbnailUrls: z.array(z.url()).nullable(), // 썸네일이 하나도 없으면 null (pickThumbnail과 동일 규칙)
  locationCategory: z.enum(LocationCategory).nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  minPrice: z.number().int().nonnegative().nullable(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  shootingCategories: z.array(z.enum(ShootingCategory)),
  serviceCodes: z.array(z.enum(ServiceCode)),
  isWishlisted: z.boolean(),
  productSummaries: z.array(studioSearchProductSummarySchema),
});

export const studioSearchAppliedFiltersSchema = z.object({
  locationCategory: z.enum(LocationCategory).nullable(),
  date: z.string().nullable(),
  shootingCategories: z.array(z.enum(ShootingCategory)),
  studioName: z.string().nullable(),
  sort: z.enum(StudioSort),
  minPrice: z.number().nullable(),
  maxPrice: z.number().nullable(),
  serviceCodes: z.array(z.enum(ServiceCode)),
  minRating: z.number().nullable(),
});

export const studioSearchResponseSchema = z.object({
  hasResult: z.boolean(),
  totalCount: z.number().int().nonnegative(),
  appliedFilters: studioSearchAppliedFiltersSchema,
  studios: z.array(studioSearchItemSchema),
});

export type StudioSearchResponseInputDto = z.input<
  typeof studioSearchResponseSchema
>;

export type StudioSearchResponseDto = z.output<
  typeof studioSearchResponseSchema
>;

export function createStudioSearchResponse(
  input: StudioSearchResponseInputDto,
): StudioSearchResponseDto {
  return studioSearchResponseSchema.parse(input);
}

export type SearchStudiosSuccessResponseDto = {
  success: true;
  code: "STUDIO_200";
  message: string;
  data: StudioSearchResponseDto;
};
