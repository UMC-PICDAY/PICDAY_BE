import { prisma } from "../../config/prisma.js";

export async function findAllStudios() {
  // TODO: Studio 모델 추가 후 구현
  void prisma;
  return [];
}

export async function findStudioById(id: string) {
  // TODO: Studio 모델 추가 후 구현
  void id;
  void prisma;
  return null;
}

export async function createStudio(_data: {
  name: string;
  description?: string | undefined;
  address: string;
}) {
  // TODO: Studio 모델 추가 후 구현
  return null;
}

// === 예약 가능 시간 조회 API ===
export async function findStudioWithTimeSlotsByDate(
  studioId: bigint,
  date: Date,
) {
  return prisma.studio.findUnique({
    where: { id: studioId },
    select: {
      id: true,
      timeSlots: {
        where: { date },
        orderBy: { startTime: "asc" },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          isAvailable: true,
        },
      },
    },
  });
}

export type FindStudioWithTimeSlotsByDateResult = Awaited<
  ReturnType<typeof findStudioWithTimeSlotsByDate>
>;

// === 컨셉 목록 조회 API ===
export async function findStudioProducts(studioId: bigint) {
  return prisma.studio.findUnique({
    where: { id: studioId },
    select: {
      id: true,
      name: true,
      products: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          shootingCategory: true,
          name: true,
          price: true,
          basePeople: true,
          shortDescription: true,
          productImages: {
            orderBy: { order: "asc" },
            select: {
              url: true,
              order: true,
            },
          },
        },
      },
    },
  });
}

export type FindStudioProductsResult = Awaited<
  ReturnType<typeof findStudioProducts>
>;

// === 헤어메이크업 연계 상세 조회 API ===
export async function findStudioHairMakeupDetails(studioId: bigint) {
  return prisma.studio.findUnique({
    where: { id: studioId },
    select: {
      id: true,
      studioServices: {
        where: { serviceCode: "HAIR_MAKEUP" },
        select: {
          hairMakeupDetails: {
            orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
            select: {
              id: true,
              partnerName: true,
              additionalPrice: true,
            },
          },
        },
      },
    },
  });
}

export type FindStudioHairMakeupDetailsResult = Awaited<
  ReturnType<typeof findStudioHairMakeupDetails>
>;

export async function findTimeSlotById(timeSlotId: bigint) {
  return prisma.timeSlot.findUnique({
    where: { id: timeSlotId },
    select: {
      id: true,
      studioId: true,
      date: true,
      startTime: true,
      endTime: true,
      isAvailable: true,
    },
  });
}

export type FindTimeSlotByIdResult = Awaited<
  ReturnType<typeof findTimeSlotById>
>;

// === 컨셉 사진 상세 조회 API ===
export async function findStudioForProductDetail(studioId: bigint) {
  return prisma.studio.findUnique({
    where: { id: studioId },
    select: {
      id: true,
      name: true,
    },
  });
}

export type FindStudioForProductDetailResult = Awaited<
  ReturnType<typeof findStudioForProductDetail>
>;

export async function findStudioProductDetailById(studioProductId: bigint) {
  return prisma.studioProduct.findUnique({
    where: { id: studioProductId },
    select: {
      id: true,
      studioId: true,
      name: true,
      productImages: {
        orderBy: { order: "asc" },
        select: {
          url: true,
        },
      },
    },
  });
}

export type FindStudioProductDetailByIdResult = Awaited<
  ReturnType<typeof findStudioProductDetailById>
>;

// === 사진관 상세 정보 조회 API ===
export async function findStudioDetailById(studioId: bigint) {
  return prisma.studio.findUnique({
    where: { id: studioId },
    select: {
      id: true,
      name: true,
      introduction: true,
      notice: true,
      location: {
        select: {
          locationCategory: true,
          mainAddress: true,
          subAddress: true,
          latitude: true,
          longitude: true,
          nearestStation: true,
          walkingMinutes: true,
          stationDetail: true,
        },
      },
      products: {
        orderBy: { id: "asc" },
        take: 2,
        select: {
          id: true,
          name: true,
          price: true,
          productImages: {
            orderBy: { order: "asc" },
            take: 1,
            select: {
              id: true,
              url: true,
              order: true,
            },
          },
        },
      },
      studioServices: {
        orderBy: { serviceCode: "asc" },
        select: {
          serviceCode: true,
          _count: {
            select: {
              hairMakeupDetails: true,
            },
          },
        },
      },
      studioInfoItems: {
        orderBy: [{ infoSectionId: "asc" }, { id: "asc" }],
        select: {
          content: true,
          infoSection: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });
}

export type FindStudioDetailByIdResult = Awaited<
  ReturnType<typeof findStudioDetailById>
>;

export async function findStudioRepresentativeImages(studioId: bigint) {
  return prisma.productImage.findMany({
    where: {
      studioThumbnailOrder: { not: null },
      studioProduct: { studioId },
    },
    orderBy: [{ studioThumbnailOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      url: true,
      studioThumbnailOrder: true,
    },
  });
}

export type FindStudioRepresentativeImagesResult = Awaited<
  ReturnType<typeof findStudioRepresentativeImages>
>;

export async function existsWishlist(studioId: bigint, userId: bigint) {
  const wishlist = await prisma.wishlist.findUnique({
    where: {
      userId_studioId: {
        userId,
        studioId,
      },
    },
    select: { id: true },
  });

  return wishlist !== null;
}

export type ExistsWishlistResult = Awaited<ReturnType<typeof existsWishlist>>;

export async function findStudioReviewSummary(studioId: bigint) {
  return prisma.review.aggregate({
    where: { studioId },
    _avg: { rating: true },
    _count: { _all: true },
  });
}

export type FindStudioReviewSummaryResult = Awaited<
  ReturnType<typeof findStudioReviewSummary>
>;

export async function findStudioPreviewReview(studioId: bigint) {
  return prisma.review.findFirst({
    where: { studioId },
    orderBy: [
      { likes: { _count: "desc" } },
      { createdAt: "desc" },
      { id: "desc" },
    ],
    select: {
      id: true,
      rating: true,
      createdAt: true,
      content: true,
      user: {
        select: {
          nickname: true,
        },
      },
      images: {
        orderBy: { id: "asc" },
        select: {
          url: true,
        },
      },
      _count: {
        select: {
          likes: true,
        },
      },
    },
  });
}

export type FindStudioPreviewReviewResult = Awaited<
  ReturnType<typeof findStudioPreviewReview>
>;
