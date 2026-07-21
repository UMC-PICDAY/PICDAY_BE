import { prisma } from "../../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";

export type CreateReviewInput = {
  userId: bigint;
  studioId: bigint;
  reservationId: bigint;
  rating: number;
  content: string;
  imageUrls: string[];
};

export type CreateReviewOutcome =
  | { kind: "CREATED"; review: { id: bigint } }
  | { kind: "DUPLICATE" };

export type UpdateReviewInput = {
  reviewId: bigint;
  rating?: number;
  content?: string;
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
  const { reviewId, rating, content, imageUrls } = input;

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

    return review;
  });
}

export async function deleteReview(reviewId: bigint) {
  // 자식 레코드(이미지·도움돼요) 먼저 삭제 후 리뷰 삭제
  await prisma.$transaction([
    prisma.reviewImage.deleteMany({ where: { reviewId } }),
    prisma.reviewLike.deleteMany({ where: { reviewId } }),
    prisma.review.delete({ where: { id: reviewId } }),
  ]);
}
