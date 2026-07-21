import { ZodError } from "zod";
import { AppError } from "../../common/error.js";
import {
  createReviewRequestSchema,
  getReviewsQuerySchema,
  reviewIdParamsSchema,
  studioIdParamsSchema,
  updateReviewRequestSchema,
  type GetReviewsResponseDto,
  type ReviewLikeResponseDto,
} from "./review.dto.js";
import * as reviewRepository from "./review.repository.js";

// zod 이슈의 필드별로 에러 코드 매핑 (rating→4001, content→4002, imageUrls→4003)
function toValidationError(error: ZodError): AppError {
  const fields = new Set(error.issues.map((issue) => issue.path[0]));

  if (fields.has("rating")) {
    return new AppError("REVIEW_4001");
  }
  if (fields.has("content")) {
    return new AppError("REVIEW_4002");
  }
  if (fields.has("imageUrls")) {
    return new AppError("REVIEW_4003");
  }
  return new AppError("COMMON_400");
}

function parseReviewId(reviewIdParam: string): bigint {
  try {
    const params = reviewIdParamsSchema.parse({ reviewId: reviewIdParam });
    return BigInt(params.reviewId);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("COMMON_400");
    }
    throw error;
  }
}

function parseStudioId(studioIdParam: string): bigint {
  try {
    const params = studioIdParamsSchema.parse({ studioId: studioIdParam });
    return BigInt(params.studioId);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("REVIEW_4044");
    }
    throw error;
  }
}

// ====== 리뷰 목록 조회 ======
export async function getReviews(
  userId: bigint,
  studioIdParam: string,
  query: unknown,
): Promise<GetReviewsResponseDto> {
  try {
    const studioId = parseStudioId(studioIdParam);

    let parsed;
    try {
      parsed = getReviewsQuerySchema.parse(query);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError("REVIEW_4005");
      }
      throw error;
    }

    const studio = await reviewRepository.findStudioExists(studioId);
    if (!studio) {
      throw new AppError("REVIEW_4044");
    }

    const summary = await reviewRepository.findReviewSummary(studioId);
    const rows = await reviewRepository.findReviewPage({
      studioId,
      sort: parsed.sort,
      photoOnly: parsed.photoOnly,
      page: parsed.page,
      size: parsed.size,
    });

    const reviewIds = rows.map((row) => row.id);
    const [likedIds, bestReviewId] = await Promise.all([
      reviewRepository.findLikedReviewIds(userId, reviewIds),
      reviewRepository.findBestReviewId(studioId),
    ]);

    return {
      summary: {
        avgRating: Math.round(summary.avgRating * 10) / 10,
        totalCount: summary.totalCount,
        photoReviewCount: summary.photoReviewCount,
      },
      page: parsed.page,
      size: parsed.size,
      items: rows.map((row) => ({
        reviewId: Number(row.id),
        writerNickname: row.user.nickname,
        rating: row.rating,
        content: row.content,
        images: row.images.map((image) => image.url),
        likeCount: row._count.likes,
        isLiked: likedIds.has(row.id),
        isBest: bestReviewId !== null && row.id === bestReviewId,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("REVIEW_5001");
  }
}

// ====== 리뷰 추천 ======
export async function addLike(
  userId: bigint,
  reviewIdParam: string,
): Promise<ReviewLikeResponseDto> {
  try {
    const reviewId = parseReviewId(reviewIdParam);

    const review = await reviewRepository.findReviewExists(reviewId);
    if (!review) {
      throw new AppError("REVIEW_4042");
    }

    const outcome = await reviewRepository.addReviewLike(reviewId, userId);
    if (outcome === "DUPLICATE") {
      throw new AppError("REVIEW_4092");
    }

    const likeCount = await reviewRepository.countReviewLikes(reviewId);
    return { reviewId: Number(reviewId), likeCount };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("REVIEW_5001");
  }
}

// ====== 리뷰 추천 취소 ======
export async function removeLike(
  userId: bigint,
  reviewIdParam: string,
): Promise<ReviewLikeResponseDto> {
  try {
    const reviewId = parseReviewId(reviewIdParam);

    const review = await reviewRepository.findReviewExists(reviewId);
    if (!review) {
      throw new AppError("REVIEW_4042");
    }

    const deleted = await reviewRepository.removeReviewLike(reviewId, userId);
    if (deleted === 0) {
      throw new AppError("REVIEW_4043");
    }

    const likeCount = await reviewRepository.countReviewLikes(reviewId);
    return { reviewId: Number(reviewId), likeCount };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("REVIEW_5001");
  }
}

// ====== 리뷰 작성 ======
export async function createReview(
  userId: bigint,
  body: unknown,
): Promise<{ reviewId: number }> {
  try {
    let request;

    try {
      request = createReviewRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        throw toValidationError(error);
      }
      throw error;
    }

    const reservation = await reviewRepository.findReservationForReview(
      BigInt(request.reservationId),
    );

    if (!reservation) {
      throw new AppError("REVIEW_4041");
    }
    if (reservation.userId !== userId) {
      throw new AppError("REVIEW_4031");
    }
    if (reservation.status !== "COMPLETED") {
      throw new AppError("REVIEW_4004");
    }

    const outcome = await reviewRepository.createReview({
      userId,
      studioId: reservation.studioProduct.studioId,
      reservationId: reservation.id,
      rating: request.rating,
      content: request.content,
      imageUrls: request.imageUrls ?? [],
    });

    if (outcome.kind === "DUPLICATE") {
      throw new AppError("REVIEW_4091");
    }

    return { reviewId: Number(outcome.review.id) };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("REVIEW_5001");
  }
}

// ====== 리뷰 수정 ======
export async function updateReview(
  userId: bigint,
  reviewIdParam: string,
  body: unknown,
): Promise<{ reviewId: number }> {
  try {
    const reviewId = parseReviewId(reviewIdParam);

    let request;
    try {
      request = updateReviewRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        throw toValidationError(error);
      }
      throw error;
    }

    const review = await reviewRepository.findReviewOwner(reviewId);

    if (!review) {
      throw new AppError("REVIEW_4042");
    }
    if (review.userId !== userId) {
      throw new AppError("REVIEW_4032");
    }

    const updated = await reviewRepository.updateReview({
      reviewId,
      ...(request.rating !== undefined && { rating: request.rating }),
      ...(request.content !== undefined && { content: request.content }),
      ...(request.imageUrls !== undefined && { imageUrls: request.imageUrls }),
    });

    return { reviewId: Number(updated.id) };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("REVIEW_5001");
  }
}

// ====== 리뷰 삭제 ======
export async function removeReview(
  userId: bigint,
  reviewIdParam: string,
): Promise<null> {
  try {
    const reviewId = parseReviewId(reviewIdParam);

    const review = await reviewRepository.findReviewOwner(reviewId);

    if (!review) {
      throw new AppError("REVIEW_4042");
    }
    if (review.userId !== userId) {
      throw new AppError("REVIEW_4032");
    }

    await reviewRepository.deleteReview(reviewId);

    return null;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("REVIEW_5001");
  }
}
