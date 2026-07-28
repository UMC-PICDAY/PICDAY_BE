import { z } from "zod";

const ratingSchema = z
  .number()
  .int("rating은 정수여야 합니다.")
  .min(1, "rating은 1~5 사이여야 합니다.")
  .max(5, "rating은 1~5 사이여야 합니다.");

const contentSchema = z
  .string()
  .trim()
  .min(10, "content는 10~500자여야 합니다.")
  .max(500, "content는 10~500자여야 합니다.");

const imageUrlsSchema = z
  .array(z.string().trim().min(1).max(500, "이미지 URL은 500자 이하여야 합니다."))
  .max(5, "이미지는 최대 5개까지 가능합니다.")
  .nullable();

// 리뷰 태그 ("어떤 점이 좋았나요?") — 선택 항목, 개수 제한 없음
export const reviewKeywordSchema = z.enum([
  "KIND_SERVICE",
  "DETAILED_RETOUCH",
  "ON_TIME",
  "COMFORTABLE_MOOD",
  "REASONABLE_PRICE",
  "SATISFYING_RESULT",
]);

export type ReviewKeywordValue = z.infer<typeof reviewKeywordSchema>;

const keywordsSchema = z
  .array(reviewKeywordSchema)
  .refine(
    (keywords) => new Set(keywords).size === keywords.length,
    "동일한 태그를 중복해서 선택할 수 없습니다.",
  )
  .nullable();

// 리뷰 작성 API
export const createReviewRequestSchema = z
  .object({
    reservationId: z
      .number()
      .int("reservationId는 정수여야 합니다.")
      .positive("reservationId는 양수여야 합니다.")
      .max(Number.MAX_SAFE_INTEGER, "reservationId가 허용 범위를 초과했습니다."),
    rating: ratingSchema,
    content: contentSchema,
    keywords: keywordsSchema.optional(),
    imageUrls: imageUrlsSchema.optional(),
  })
  .strict();

export type CreateReviewRequestDto = z.infer<typeof createReviewRequestSchema>;

export type CreateReviewSuccessResponseDto = {
  success: true;
  code: "COMMON_201";
  message: string;
  data: { reviewId: number };
};

// 리뷰 수정 API (부분 수정, imageUrls는 전체 교체)
export const updateReviewRequestSchema = z
  .object({
    rating: ratingSchema.optional(),
    content: contentSchema.optional(),
    keywords: keywordsSchema.optional(),
    imageUrls: imageUrlsSchema.optional(),
  })
  .strict()
  .refine(
    (body) => Object.keys(body).length > 0,
    "수정할 필드를 하나 이상 전달해야 합니다.",
  );

export type UpdateReviewRequestDto = z.infer<typeof updateReviewRequestSchema>;

export type UpdateReviewSuccessResponseDto = {
  success: true;
  code: "COMMON_200";
  message: string;
  data: { reviewId: number };
};

// 리뷰 목록 조회 API
export const reviewSortSchema = z
  .enum(["recent", "recommend", "ratingHigh", "ratingLow"])
  .default("recent");

export type ReviewSort = z.infer<typeof reviewSortSchema>;

export const getReviewsQuerySchema = z.object({
  sort: reviewSortSchema,
  photoOnly: z.boolean().default(false),
  page: z.number().int().min(1).default(1),
  size: z.number().int().min(1).max(50).default(10),
});

export type GetReviewsQuery = z.infer<typeof getReviewsQuerySchema>;

export const studioIdParamsSchema = z.object({
  studioId: z
    .number()
    .int("studioId는 정수여야 합니다.")
    .positive("studioId는 양수여야 합니다.")
    .max(Number.MAX_SAFE_INTEGER, "studioId가 허용 범위를 초과했습니다."),
});

export type ReviewListItemDto = {
  reviewId: number;
  writerNickname: string | null;
  conceptName: string;
  rating: number;
  content: string;
  keywords: ReviewKeywordValue[];
  images: string[];
  likeCount: number;
  isLiked: boolean;
  isBest: boolean;
  createdAt: string;
};

export type GetReviewsResponseDto = {
  summary: {
    avgRating: number;
    totalCount: number;
    photoReviewCount: number;
  };
  page: number;
  size: number;
  items: ReviewListItemDto[];
};

export type GetReviewsSuccessResponseDto = {
  success: true;
  code: "COMMON_200";
  message: string;
  data: GetReviewsResponseDto;
};

// 리뷰 단건 조회 API (마이페이지 "내 리뷰")
export type ReviewDetailDto = {
  reviewId: number;
  studioName: string;
  conceptName: string;
  shootingDate: string;
  rating: number;
  keywords: ReviewKeywordValue[];
  images: string[];
  content: string;
  createdAt: string;
};

export type GetReviewDetailSuccessResponseDto = {
  success: true;
  code: "COMMON_200";
  message: string;
  data: ReviewDetailDto;
};

// 리뷰 추천 / 추천 취소 API
export type ReviewLikeResponseDto = {
  reviewId: number;
  likeCount: number;
};

export type AddReviewLikeSuccessResponseDto = {
  success: true;
  code: "COMMON_201";
  message: string;
  data: ReviewLikeResponseDto;
};

export type RemoveReviewLikeSuccessResponseDto = {
  success: true;
  code: "COMMON_200";
  message: string;
  data: ReviewLikeResponseDto;
};

// 리뷰 삭제 API
export const reviewIdParamsSchema = z.object({
  reviewId: z
    .number()
    .int("reviewId는 정수여야 합니다.")
    .positive("reviewId는 양수여야 합니다.")
    .max(Number.MAX_SAFE_INTEGER, "reviewId가 허용 범위를 초과했습니다."),
});

export type DeleteReviewSuccessResponseDto = {
  success: true;
  code: "COMMON_200";
  message: string;
  data: null;
};
