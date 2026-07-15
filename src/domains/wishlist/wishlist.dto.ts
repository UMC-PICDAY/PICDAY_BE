import { z } from "zod";

// 위시리스트 목록 조회 API
export const getWishlistsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(50).default(10),
});

export type GetWishlistsQuery = z.infer<typeof getWishlistsQuerySchema>;

export type WishlistItemDto = {
  wishlistId: number;
  studioId: number;
  studioName: string;
  thumbnail: string | null;
  region: string | null;
  minPrice: number | null;
  rating: number;
};

export type GetWishlistsResponseDto = {
  totalCount: number;
  page: number;
  size: number;
  items: WishlistItemDto[];
};

export type GetWishlistsSuccessResponseDto = {
  success: true;
  code: "COMMON_200";
  message: string;
  data: GetWishlistsResponseDto;
};

// 위시리스트 추가 API
export const addWishlistRequestSchema = z
  .object({
    studioId: z
      .number()
      .int("studioId는 정수여야 합니다.")
      .positive("studioId는 양수여야 합니다.")
      .max(Number.MAX_SAFE_INTEGER, "studioId가 허용 범위를 초과했습니다."),
  })
  .strict();

export type AddWishlistRequestDto = z.infer<typeof addWishlistRequestSchema>;

export type AddWishlistResponseDto = {
  wishlistId: number;
  studioId: number;
};

export type AddWishlistSuccessResponseDto = {
  success: true;
  code: "COMMON_201";
  message: string;
  data: AddWishlistResponseDto;
};

// 위시리스트 삭제 API
export const wishlistStudioIdParamsSchema = z.object({
  studioId: z.string().regex(/^\d+$/, "유효하지 않은 사진관 ID입니다."),
});

export type DeleteWishlistSuccessResponseDto = {
  success: true;
  code: "COMMON_200";
  message: string;
  data: null;
};
