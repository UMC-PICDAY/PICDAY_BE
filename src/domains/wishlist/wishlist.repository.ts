import { prisma } from "../../config/prisma.js";
import {
  Prisma,
  type LocationCategory,
} from "../../generated/prisma/client.js";

export type WishlistPageRow = {
  id: bigint;
  studioId: bigint;
  studio: {
    name: string;
    // 평균 평점 — 배치가 하루 1회 산출해 채우는 컬럼 (아직 산출 전이면 null)
    ratingScore: number | null;
    location: { locationCategory: LocationCategory } | null;
    products: {
      price: number;
      productImages: { url: string; studioThumbnailOrder: number | null }[];
    }[];
  };
};

export type CreateWishlistOutcome =
  | { kind: "CREATED"; wishlist: { id: bigint; studioId: bigint } }
  | { kind: "DUPLICATE" };

export async function findWishlistPage(
  userId: bigint,
  page: number,
  size: number,
): Promise<{ totalCount: number; wishlists: WishlistPageRow[] }> {
  const [totalCount, wishlists] = await Promise.all([
    prisma.wishlist.count({ where: { userId } }),
    prisma.wishlist.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * size,
      take: size,
      select: {
        id: true,
        studioId: true,
        studio: {
          select: {
            name: true,
            ratingScore: true,
            location: { select: { locationCategory: true } },
            products: {
              select: {
                price: true,
                productImages: {
                  where: { studioThumbnailOrder: { not: null } },
                  select: { url: true, studioThumbnailOrder: true },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  return { totalCount, wishlists };
}

export async function findStudioById(studioId: bigint) {
  return prisma.studio.findUnique({
    where: { id: studioId },
    select: { id: true },
  });
}

export async function createWishlist(
  userId: bigint,
  studioId: bigint,
): Promise<CreateWishlistOutcome> {
  try {
    const wishlist = await prisma.wishlist.create({
      data: { userId, studioId },
      select: { id: true, studioId: true },
    });

    return { kind: "CREATED", wishlist };
  } catch (error) {
    // UNIQUE(user_id, studio_id) 제약 위반 = 이미 찜한 사진관
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { kind: "DUPLICATE" };
    }
    throw error;
  }
}

export async function deleteWishlist(userId: bigint, studioId: bigint) {
  const { count } = await prisma.wishlist.deleteMany({
    where: { userId, studioId },
  });

  return count;
}
