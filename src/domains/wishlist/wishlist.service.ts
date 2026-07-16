import { ZodError } from "zod";
import { AppError } from "../../common/error.js";
import {
  addWishlistRequestSchema,
  getWishlistsQuerySchema,
  wishlistStudioIdParamsSchema,
  type AddWishlistResponseDto,
  type GetWishlistsResponseDto,
  type WishlistItemDto,
} from "./wishlist.dto.js";
import * as wishlistRepository from "./wishlist.repository.js";
import type { WishlistPageRow } from "./wishlist.repository.js";

// UI 표기용 지역 라벨 (studio_location.location_category 기준)
const LOCATION_CATEGORY_LABELS: Record<string, string> = {
  HONGDAE: "홍대",
  GANGNAM: "강남",
  SEONGSU: "성수",
  YEONNAM: "연남",
  KONDAE: "건대",
  SINCHON: "신촌",
  JAMSIL: "잠실",
  APGUJEONG: "압구정",
  HYEHWA: "혜화",
  JONGNO: "종로",
};

function toWishlistItem(
  row: WishlistPageRow,
  ratingByStudioId: Map<bigint, number>,
): WishlistItemDto {
  const { studio } = row;

  // 대표 썸네일 = studio_thumbnail_order가 가장 낮은 상품 이미지
  let thumbnail: string | null = null;
  let thumbnailOrder = Number.POSITIVE_INFINITY;

  // 최저가 (₩30,000~ 표기용)
  let minPrice: number | null = null;

  for (const product of studio.products) {
    if (minPrice === null || product.price < minPrice) {
      minPrice = product.price;
    }

    for (const image of product.productImages) {
      if (
        image.studioThumbnailOrder !== null &&
        image.studioThumbnailOrder < thumbnailOrder
      ) {
        thumbnailOrder = image.studioThumbnailOrder;
        thumbnail = image.url;
      }
    }
  }

  const category = studio.location?.locationCategory;
  const avgRating = ratingByStudioId.get(row.studioId);

  return {
    wishlistId: Number(row.id),
    studioId: Number(row.studioId),
    studioName: studio.name,
    thumbnail,
    region: category ? (LOCATION_CATEGORY_LABELS[category] ?? category) : null,
    minPrice,
    rating: avgRating === undefined ? 0 : Math.round(avgRating * 10) / 10,
  };
}

// ====== 위시리스트 목록 조회 ======
export async function getWishlists(
  userId: bigint,
  query: unknown,
): Promise<GetWishlistsResponseDto> {
  try {
    let page: number;
    let size: number;

    try {
      ({ page, size } = getWishlistsQuerySchema.parse(query));
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError("WISHLIST_4001");
      }
      throw error;
    }

    const { totalCount, wishlists } = await wishlistRepository.findWishlistPage(
      userId,
      page,
      size,
    );

    const ratings = await wishlistRepository.findStudioRatings(
      wishlists.map((row) => row.studioId),
    );
    const ratingByStudioId = new Map(
      ratings
        .filter((entry) => entry._avg.rating !== null)
        .map((entry) => [entry.studioId, entry._avg.rating!]),
    );

    return {
      totalCount,
      page,
      size,
      items: wishlists.map((row) => toWishlistItem(row, ratingByStudioId)),
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("WISHLIST_5001");
  }
}

// ====== 위시리스트 추가 ======
export async function addWishlist(
  userId: bigint,
  body: unknown,
): Promise<AddWishlistResponseDto> {
  try {
    let studioId: bigint;

    try {
      const request = addWishlistRequestSchema.parse(body);
      studioId = BigInt(request.studioId);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError("WISHLIST_4002");
      }
      throw error;
    }

    const studio = await wishlistRepository.findStudioById(studioId);
    if (!studio) {
      throw new AppError("WISHLIST_4041");
    }

    const outcome = await wishlistRepository.createWishlist(userId, studioId);

    if (outcome.kind === "DUPLICATE") {
      throw new AppError("WISHLIST_4091");
    }

    return {
      wishlistId: Number(outcome.wishlist.id),
      studioId: Number(outcome.wishlist.studioId),
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("WISHLIST_5001");
  }
}

// ====== 위시리스트 삭제 ======
export async function removeWishlist(
  userId: bigint,
  studioIdParam: string,
): Promise<null> {
  try {
    let studioId: bigint;

    try {
      const params = wishlistStudioIdParamsSchema.parse({
        studioId: studioIdParam,
      });
      studioId = BigInt(params.studioId);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError("WISHLIST_4002");
      }
      throw error;
    }

    const deletedCount = await wishlistRepository.deleteWishlist(
      userId,
      studioId,
    );

    if (deletedCount === 0) {
      throw new AppError("WISHLIST_4042");
    }

    return null;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("WISHLIST_5001");
  }
}
