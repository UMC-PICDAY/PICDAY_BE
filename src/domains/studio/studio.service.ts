import { ZodError } from "zod";
import { AppError } from "../../common/error.js";
import {
  createStudioDetailResponse,
  createStudioProductsResponse,
  parseGetStudioDetailRequest,
  parseGetStudioProductDetailRequest,
  parseGetStudioProductsRequest,
  parseGetStudioSlotsRequest,
  studioProductDetailResponseSchema,
  studioSlotsResponseSchema,
  type GetStudioDetailQuery,
  type GetStudioProductDetailQuery,
  type GetStudioProductsQuery,
  type GetStudioSlotsQuery,
  type StudioDetailResponseDto,
  type StudioDetailResponseInputDto,
  type StudioProductDetailResponseDto,
  type StudioProductsResponseDto,
  type StudioProductsResponseInputDto,
  type StudioSlotsResponseDto,
} from "./studio.dto.js";
import * as studioRepository from "./studio.repository.js";

const KST_OFFSET_MILLISECONDS = 9 * 60 * 60 * 1000;

type NowProvider = () => Date;
type TimestampProvider = () => number;

function formatDatePart(value: number) {
  return value.toString().padStart(2, "0");
}

function getKstDateTime(now: Date) {
  const shifted = new Date(now.getTime() + KST_OFFSET_MILLISECONDS);

  return {
    dateText: `${shifted.getUTCFullYear()}-${formatDatePart(
      shifted.getUTCMonth() + 1,
    )}-${formatDatePart(shifted.getUTCDate())}`,
    secondsSinceMidnight:
      shifted.getUTCHours() * 60 * 60 +
      shifted.getUTCMinutes() * 60 +
      shifted.getUTCSeconds(),
  };
}

function getTimeSeconds(date: Date) {
  return (
    date.getUTCHours() * 60 * 60 +
    date.getUTCMinutes() * 60 +
    date.getUTCSeconds()
  );
}

function getKstSlotStartMilliseconds(date: Date, startTime: Date) {
  return (
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      startTime.getUTCHours(),
      startTime.getUTCMinutes(),
      startTime.getUTCSeconds(),
      startTime.getUTCMilliseconds(),
    ) - KST_OFFSET_MILLISECONDS
  );
}

function groupStudioProducts(
  products: NonNullable<
    studioRepository.FindStudioProductsResult
  >["products"],
): StudioProductsResponseInputDto["productGroups"] {
  type ProductGroup =
    StudioProductsResponseInputDto["productGroups"][number];

  const groups = new Map<
    ProductGroup["shootingCategory"],
    ProductGroup
  >();

  for (const product of products) {
    let group = groups.get(product.shootingCategory);

    if (!group) {
      group = {
        shootingCategory: product.shootingCategory,
        products: [],
      };

      groups.set(product.shootingCategory, group);
    }

    group.products.push({
      studioProductId: product.id,
      productName: product.name,
      imageUrls: product.productImages.map((image) => image.url),
      price: product.price,
      basePeople: product.basePeople,
      shortDescription: product.shortDescription,
    });
  }

  return [...groups.values()];
}

// === 예약 가능 시간 조회 API ===
export async function getStudioSlots(
  rawStudioId: string,
  rawDate: string | undefined,
  nowProvider: NowProvider = () => new Date(),
): Promise<StudioSlotsResponseDto> {
  try {
    let query: GetStudioSlotsQuery;

    try {
      query = parseGetStudioSlotsRequest({
        studioId: rawStudioId,
        date: rawDate,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError("STUDIO_4001");
      }

      throw error;
    }

    const kstNow = getKstDateTime(nowProvider());

    if (query.dateText < kstNow.dateText) {
      throw new AppError("STUDIO_4002");
    }

    const studio =
      await studioRepository.findStudioWithTimeSlotsByDate(
        query.studioId,
        query.dbDate,
      );

    if (!studio) {
      throw new AppError("STUDIO_4041");
    }

    const isToday = query.dateText === kstNow.dateText;

    return studioSlotsResponseSchema.parse(
      studio.timeSlots.map((slot) => ({
        slotId: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable:
          slot.isAvailable &&
          (!isToday ||
            getTimeSeconds(slot.startTime) >
              kstNow.secondsSinceMidnight),
      })),
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("STUDIO_5001");
  }
}

// === 컨셉 목록 조회 API ===
export async function getStudioProducts(
  rawStudioId: string,
  rawTimeSlotId?: string,
  nowProvider: TimestampProvider = Date.now,
): Promise<StudioProductsResponseDto> {
  try {
    let query: GetStudioProductsQuery;

    try {
      query = parseGetStudioProductsRequest({
        studioId: rawStudioId,
        timeSlotId: rawTimeSlotId,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError("STUDIO_4001");
      }

      throw error;
    }

    const studio = await studioRepository.findStudioProducts(
      query.studioId,
    );

    if (!studio) {
      throw new AppError("STUDIO_4041");
    }

    let selectedSlot:
      | StudioProductsResponseInputDto["selectedSlot"] = null;

    if (query.timeSlotId !== undefined) {
      const slot = await studioRepository.findTimeSlotById(
        query.timeSlotId,
      );

      if (!slot) {
        throw new AppError("STUDIO_4045");
      }

      if (slot.studioId !== query.studioId) {
        throw new AppError("STUDIO_40015");
      }

      selectedSlot = {
        timeSlotId: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable:
          slot.isAvailable &&
          getKstSlotStartMilliseconds(
            slot.date,
            slot.startTime,
          ) > nowProvider(),
      };
    }

    return createStudioProductsResponse({
      studioId: studio.id,
      studioName: studio.name,
      selectedSlot,
      productGroups: groupStudioProducts(studio.products),
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("COMMON_500");
  }
}

// === 컨셉 사진 상세 조회 API ===
export async function getStudioProductDetail(
  rawStudioId: string,
  rawStudioProductId: string,
): Promise<StudioProductDetailResponseDto> {
  try {
    let query: GetStudioProductDetailQuery;

    try {
      query = parseGetStudioProductDetailRequest({
        studioId: rawStudioId,
        studioProductId: rawStudioProductId,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const hasStudioIdError = error.issues.some(
          (issue) => issue.path[0] === "studioId",
        );

        throw new AppError(
          hasStudioIdError ? "STUDIO_40011" : "STUDIO_4006",
        );
      }

      throw error;
    }

    const studio =
      await studioRepository.findStudioForProductDetail(
        query.studioId,
      );

    if (!studio) {
      throw new AppError("STUDIO_4041");
    }

    const product =
      await studioRepository.findStudioProductDetailById(
        query.studioProductId,
      );

    if (!product) {
      throw new AppError("STUDIO_4043");
    }

    if (product.studioId !== query.studioId) {
      throw new AppError("STUDIO_4044");
    }

    return studioProductDetailResponseSchema.parse({
      studioId: studio.id,
      studioName: studio.name,
      studioProductId: product.id,
      productName: product.name,
      imageUrls: product.productImages.map(
        (image) => image.url,
      ),
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("COMMON_500");
  }
}

const STATION_LINE_CODES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13]);

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function getStationLineCodes(stationDetail: unknown) {
  if (!Array.isArray(stationDetail)) {
    return [];
  }

  return stationDetail.filter(
    (code): code is number =>
      typeof code === "number" &&
      Number.isInteger(code) &&
      STATION_LINE_CODES.has(code),
  );
}

function createStudioInfo(
  items: NonNullable<studioRepository.FindStudioDetailByIdResult>["studioInfoItems"],
): StudioDetailResponseInputDto["studioInfo"] {
  const studioInfo: StudioDetailResponseInputDto["studioInfo"] = {
    operation: [],
    parking: [],
    shootingGuide: [],
    refundGuide: [],
  };

  for (const item of items) {
    const lines = splitLines(item.content);

    switch (item.infoSection.title) {
      case "운영 정보":
        studioInfo.operation.push(...lines);
        break;
      case "주차 정보":
        studioInfo.parking.push(...lines);
        break;
      case "촬영 안내":
        studioInfo.shootingGuide.push(...lines);
        break;
      case "환불 안내":
        studioInfo.refundGuide.push(...lines);
        break;
    }
  }

  return studioInfo;
}

// === 사진관 상세 정보 조회 API ===
export async function getStudioDetail(
  rawStudioId: string,
  userId?: bigint,
): Promise<StudioDetailResponseDto> {
  try {
    let query: GetStudioDetailQuery;

    try {
      query = parseGetStudioDetailRequest({
        studioId: rawStudioId,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError("STUDIO_4001");
      }

      throw error;
    }

    const studio = await studioRepository.findStudioDetailById(query.studioId);

    if (!studio) {
      throw new AppError("STUDIO_4041");
    }

    const [representativeImages, isWishlisted, reviewSummary, previewReview] =
      await Promise.all([
        studioRepository.findStudioRepresentativeImages(query.studioId),
        userId === undefined
          ? Promise.resolve(false)
          : studioRepository.existsWishlist(query.studioId, userId),
        studioRepository.findStudioReviewSummary(query.studioId),
        studioRepository.findStudioPreviewReview(query.studioId),
      ]);

    const location = studio.location;
    const address = location
      ? [location.mainAddress, location.subAddress]
          .map((part) => part.trim())
          .filter((part) => part.length > 0)
          .join(" ") || null
      : null;
    const notice =
      studio.notice === null || studio.notice.trim().length === 0
        ? null
        : {
            title: "예약 및 촬영 안내",
            items: splitLines(studio.notice),
          };
    const hairMakeupService = studio.studioServices.find(
      (service) => service.serviceCode === "HAIR_MAKEUP",
    );
    const averageRating = reviewSummary._avg.rating;

    return createStudioDetailResponse({
      studioId: studio.id,
      studioName: studio.name,
      imageUrls: representativeImages.map((image) => image.url),
      isWishlisted,
      location: {
        locationCategory: location?.locationCategory ?? null,
        district: location?.mainAddress ?? null,
        address,
        latitude:
          location?.latitude === null || location?.latitude === undefined
            ? null
            : Number(location.latitude),
        longitude:
          location?.longitude === null || location?.longitude === undefined
            ? null
            : Number(location.longitude),
        nearestStation: location?.nearestStation ?? null,
        walkingMinutes: location?.walkingMinutes ?? null,
        stationLineCodes: getStationLineCodes(location?.stationDetail),
      },
      representativeProducts: studio.products.map((product) => ({
        studioProductId: product.id,
        productName: product.name,
        thumbnailUrl: product.productImages[0]?.url ?? null,
        price: product.price,
      })),
      serviceCodes: studio.studioServices.map((service) => service.serviceCode),
      introduction: studio.introduction,
      notice,
      studioInfo: createStudioInfo(studio.studioInfoItems),
      hairMakeupPartnerCount: hairMakeupService?._count.hairMakeupDetails ?? 0,
      reviewSummary: {
        averageRating:
          averageRating === null ? null : Math.round(averageRating * 10) / 10,
        reviewCount: reviewSummary._count._all,
        previewReview:
          previewReview === null
            ? null
            : {
                reviewId: previewReview.id,
                writerNickname: previewReview.user.nickname ?? "익명",
                isBest: previewReview._count.likes > 0,
                rating: previewReview.rating,
                createdAt: previewReview.createdAt,
                content: previewReview.content,
                imageUrls: previewReview.images.map((image) => image.url),
              },
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("COMMON_500");
  }
}
