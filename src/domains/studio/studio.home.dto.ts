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

// 1. 홈 화면 조회 API 응답 타입
export type GetHomeResponseDto = {
  bannerStudios: BannerStudioItem[];
  recentStudios: StudioWithPriceAndRatingItem[];
  popularStudios: StudioWithPriceAndRatingItem[];
  regionalStudios: {
    locationCategory: string;
    studios: StudioWithPriceAndRatingItem[];
  };
};

export type GetHomeSuccessResponseDto = {
  success: true;
  code: "COMMON_200";
  message: string;
  data: GetHomeResponseDto;
};
