// === 홈 화면 조회 API 응답 타입 ===

// 1-1
export type BannerStudioItem = {
  studioId: string;
  studioName: string;
  thumbnailUrl: string | null;
  locationCategory: string;
};

// 1-2
export type StudioWithPriceAndRatingItem = BannerStudioItem & {
  minPrice: number | null;
  rating: number;
};

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
  regionalStudios1: {
    locationCategory: string;
    studios: StudioWithPriceAndRatingItem[];
  };
  regionalStudios2: {
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
