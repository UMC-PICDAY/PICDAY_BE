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

// 리뷰 삭제 API
export const reviewIdParamsSchema = z.object({
  reviewId: z.string().regex(/^\d+$/, "유효하지 않은 리뷰 ID입니다."),
});

export type DeleteReviewSuccessResponseDto = {
  success: true;
  code: "COMMON_200";
  message: string;
  data: null;
};
