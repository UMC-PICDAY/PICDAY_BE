import { prisma } from "../../config/prisma.js";
import { Prisma, type ReviewKeyword } from "../../generated/prisma/client.js";

export type CreateReviewInput = {
  userId: bigint;
  studioId: bigint;
  reservationId: bigint;
  rating: number;
  content: string;
  keywords: ReviewKeyword[];
  imageUrls: string[];
};

export type CreateReviewOutcome =
  | { kind: "CREATED"; review: { id: bigint } }
  | { kind: "DUPLICATE" };

export type UpdateReviewInput = {
  reviewId: bigint;
  rating?: number;
  content?: string;
  // undefined = 태그 변경 없음 / null·[] = 전체 삭제 / 배열 = 전체 교체
  keywords?: ReviewKeyword[] | null;
  // undefined = 이미지 변경 없음 / null·[] = 전체 삭제 / string[] = 전체 교체
  imageUrls?: string[] | null;
};

export async function findReservationForReview(reservationId: bigint) {
  return prisma.reservation.findUnique({
    where: { id: reservationId },
    select: {
      id: true,
      userId: true,
      status: true,
      studioProduct: { select: { studioId: true } },
    },
  });
}

export async function createReview(
  input: CreateReviewInput,
): Promise<CreateReviewOutcome> {
  try {
    const review = await prisma.review.create({
      data: {
        userId: input.userId,
        studioId: input.studioId,
        reservationId: input.reservationId,
        rating: input.rating,
        content: input.content,
        images: {
          create: input.imageUrls.map((url) => ({ url })),
        },
        keywords: {
          create: input.keywords.map((keyword) => ({ keyword })),
        },
      },
      select: { id: true },
    });

    return { kind: "CREATED", review };
  } catch (error) {
    // reservation_id UNIQUE 제약 위반 = 해당 예약에 이미 리뷰 존재
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { kind: "DUPLICATE" };
    }
    throw error;
  }
}

export async function findReviewOwner(reviewId: bigint) {
  return prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true },
  });
}

export async function updateReview(input: UpdateReviewInput) {
  const { reviewId, rating, content, keywords, imageUrls } = input;

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.update({
      where: { id: reviewId },
      data: {
        ...(rating !== undefined && { rating }),
        ...(content !== undefined && { content }),
      },
      select: { id: true },
    });

    // imageUrls가 전달된 경우에만 전체 교체
    if (imageUrls !== undefined) {
      await tx.reviewImage.deleteMany({ where: { reviewId } });

      if (imageUrls !== null && imageUrls.length > 0) {
        await tx.reviewImage.createMany({
          data: imageUrls.map((url) => ({ reviewId, url })),
        });
      }
    }

    // keywords가 전달된 경우에만 전체 교체
    if (keywords !== undefined) {
      await tx.reviewKeywordTag.deleteMany({ where: { reviewId } });

      if (keywords !== null && keywords.length > 0) {
        await tx.reviewKeywordTag.createMany({
          data: keywords.map((keyword) => ({ reviewId, keyword })),
        });
      }
    }

    return review;
  });
}

export async function deleteReview(reviewId: bigint) {
  // 자식 레코드(이미지·추천·태그) 먼저 삭제 후 리뷰 삭제
  await prisma.$transaction([
    prisma.reviewImage.deleteMany({ where: { reviewId } }),
    prisma.reviewLike.deleteMany({ where: { reviewId } }),
    prisma.reviewKeywordTag.deleteMany({ where: { reviewId } }),
    prisma.review.delete({ where: { id: reviewId } }),
  ]);
}

// ====== 리뷰 목록 조회 ======
export type ReviewSortOption = "recent" | "recommend" | "ratingHigh" | "ratingLow";

type ReviewOrderBy = Prisma.ReviewOrderByWithRelationInput[];

const SORT_ORDER_BY: Record<ReviewSortOption, ReviewOrderBy> = {
  recent: [{ createdAt: "desc" }, { id: "desc" }],
  recommend: [{ likes: { _count: "desc" } }, { createdAt: "desc" }, { id: "desc" }],
  ratingHigh: [{ rating: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  ratingLow: [{ rating: "asc" }, { createdAt: "desc" }, { id: "desc" }],
};

export async function findStudioExists(studioId: bigint) {
  return prisma.studio.findUnique({
    where: { id: studioId },
    select: { id: true },
  });
}

export type ReviewSummary = {
  avgRating: number;
  totalCount: number;
  photoReviewCount: number;
};

export async function findReviewSummary(
  studioId: bigint,
): Promise<ReviewSummary> {
  const [agg, photoReviewCount] = await Promise.all([
    prisma.review.aggregate({
      where: { studioId },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.count({
      where: { studioId, images: { some: {} } },
    }),
  ]);

  return {
    avgRating: agg._avg.rating ?? 0,
    totalCount: agg._count._all,
    photoReviewCount,
  };
}

export type ReviewListRow = {
  id: bigint;
  rating: number;
  content: string;
  createdAt: Date;
  user: { nickname: string | null };
  images: { url: string }[];
  keywords: { keyword: ReviewKeyword }[];
  _count: { likes: number };
};

export async function findReviewPage(params: {
  studioId: bigint;
  sort: ReviewSortOption;
  photoOnly: boolean;
  page: number;
  size: number;
}): Promise<ReviewListRow[]> {
  const { studioId, sort, photoOnly, page, size } = params;

  return prisma.review.findMany({
    where: {
      studioId,
      ...(photoOnly && { images: { some: {} } }),
    },
    orderBy: SORT_ORDER_BY[sort],
    skip: (page - 1) * size,
    take: size,
    select: {
      id: true,
      rating: true,
      content: true,
      createdAt: true,
      user: { select: { nickname: true } },
      images: { select: { url: true } },
      keywords: { select: { keyword: true } },
      _count: { select: { likes: true } },
    },
  });
}

// 요청 유저가 추천한 리뷰 id 집합 (isLiked 판별용)
export async function findLikedReviewIds(
  userId: bigint,
  reviewIds: bigint[],
): Promise<Set<bigint>> {
  if (reviewIds.length === 0) {
    return new Set();
  }

  const likes = await prisma.reviewLike.findMany({
    where: { userId, reviewId: { in: reviewIds } },
    select: { reviewId: true },
  });

  return new Set(likes.map((like) => like.reviewId));
}

// isBest 판별: 해당 사진관에서 추천 수가 가장 많은 리뷰 1개.
// 단, 추천이 하나도 없으면(최다가 0) 베스트 없음(null).
export async function findBestReviewId(
  studioId: bigint,
): Promise<bigint | null> {
  const grouped = await prisma.reviewLike.groupBy({
    by: ["reviewId"],
    where: { review: { studioId } },
    _count: { reviewId: true },
    orderBy: { _count: { reviewId: "desc" } },
    take: 1,
  });

  if (grouped.length === 0 || grouped[0]!._count.reviewId === 0) {
    return null;
  }
  return grouped[0]!.reviewId;
}

// ====== 리뷰 추천 / 추천 취소 ======
export type AddLikeOutcome = "CREATED" | "DUPLICATE";

export async function findReviewExists(reviewId: bigint) {
  return prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true },
  });
}

export async function countReviewLikes(reviewId: bigint): Promise<number> {
  return prisma.reviewLike.count({ where: { reviewId } });
}

export async function addReviewLike(
  reviewId: bigint,
  userId: bigint,
): Promise<AddLikeOutcome> {
  try {
    await prisma.reviewLike.create({ data: { reviewId, userId } });
    return "CREATED";
  } catch (error) {
    // UNIQUE(review_id, user_id) 위반 = 이미 추천함
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return "DUPLICATE";
    }
    throw error;
  }
}

export async function removeReviewLike(
  reviewId: bigint,
  userId: bigint,
): Promise<number> {
  const { count } = await prisma.reviewLike.deleteMany({
    where: { reviewId, userId },
  });
  return count;
}
