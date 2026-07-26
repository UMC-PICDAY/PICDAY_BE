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
