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
  studioId: bigint;
  rating?: number;
  content?: string;
  // undefined = 태그 변경 없음 / null·[] = 전체 삭제 / 배열 = 전체 교체
  keywords?: ReviewKeyword[] | null;
  // undefined = 이미지 변경 없음 / null·[] = 전체 삭제 / string[] = 전체 교체
  imageUrls?: string[] | null;
};

// 사진관 평균 평점(studio.rating_score)을 리뷰 기준으로 다시 계산해 저장한다.
// 리뷰 CRUD와 같은 트랜잭션 안에서 호출해 리뷰와 평점이 어긋나지 않게 한다.
//
// 리뷰가 0건이면 기존 값을 그대로 둔다. 목업 평점이 들어 있는 상태에서
// 테스트로 작성한 리뷰를 지웠을 때 사진관 평점이 0으로 사라지는 것을 막기 위함.
export async function syncStudioRatingScore(
  tx: Prisma.TransactionClient,
  studioId: bigint,
) {
  const { _avg } = await tx.review.aggregate({
    where: { studioId },
    _avg: { rating: true },
  });

  if (_avg.rating === null) {
    return;
  }

  await tx.studio.update({
    where: { id: studioId },
    data: { ratingScore: Math.round(_avg.rating * 10) / 10 },
  });
}

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
    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
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

      await syncStudioRatingScore(tx, input.studioId);

      return created;
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

// 리뷰 단건 조회 (마이페이지 "내 리뷰" 화면)
// 사진관명·컨셉명·촬영일은 예약 → 상품/슬롯 경로로 함께 조회
export async function findReviewDetail(reviewId: bigint) {
  return prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      userId: true,
      rating: true,
      content: true,
      createdAt: true,
      images: { select: { url: true } },
      keywords: { select: { keyword: true } },
      studio: { select: { name: true } },
      reservation: {
        select: {
          studioProduct: { select: { name: true } },
          timeSlot: { select: { date: true } },
        },
      },
    },
  });
}

export async function findReviewOwner(reviewId: bigint) {
  return prisma.review.findUnique({
    where: { id: reviewId },
    // studioId는 수정·삭제 후 평점 재계산 대상을 찾는 데 쓰인다.
    select: { id: true, userId: true, studioId: true },
  });
}

export async function updateReview(input: UpdateReviewInput) {
  const { reviewId, studioId, rating, content, keywords, imageUrls } = input;

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

    // 별점이 바뀌었을 수 있으므로 사진관 평균 평점을 다시 계산한다.
    await syncStudioRatingScore(tx, studioId);

    return review;
  });
}

export async function deleteReview(reviewId: bigint, studioId: bigint) {
  await prisma.$transaction(async (tx) => {
    // 자식 레코드(이미지·추천·태그) 먼저 삭제 후 리뷰 삭제
    await tx.reviewImage.deleteMany({ where: { reviewId } });
    await tx.reviewLike.deleteMany({ where: { reviewId } });
    await tx.reviewKeywordTag.deleteMany({ where: { reviewId } });
    await tx.review.delete({ where: { id: reviewId } });

    await syncStudioRatingScore(tx, studioId);
  });
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
  reservation: { studioProduct: { name: string } };
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
      // 촬영 컨셉명 (리뷰 카드에 표시)
      reservation: { select: { studioProduct: { select: { name: true } } } },
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
