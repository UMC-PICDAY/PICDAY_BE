import { ZodError } from "zod";
import { AppError } from "../../common/error.js";
import * as studioCompareRepository from "./studio.compare.repository.js";
import {
  SHOOTING_PURPOSE_DISPLAY_ORDER,
  createStudioComparePurposesResponse,
  createStudioCompareResultResponse,
  getShootingPurposeDisplayName,
  parseGetStudioComparePurposesRequest,
  parseGetStudioCompareResultRequest,
  type GetStudioComparePurposesQuery,
  type GetStudioCompareResultQuery,
  type StudioComparePurposesResponseDto,
  type StudioCompareResultResponseDto,
} from "./studio.compare.dto.js";

// 사진관 촬영 목적 비교 조회 API
export async function getStudioComparePurposes(
  rawStudioIds: string[],
): Promise<StudioComparePurposesResponseDto> {
  let query: GetStudioComparePurposesQuery;

  try {
    query = parseGetStudioComparePurposesRequest({
      studioIds: rawStudioIds,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const hasElementFormatError = error.issues.some(
        (issue) => issue.path.length > 1,
      );

      throw new AppError(
        hasElementFormatError ? "STUDIO_40011" : "STUDIO_40013",
      );
    }

    throw error;
  }

  const { studioIds } = query;

  const studios = await studioCompareRepository.findStudiosForCompare(studioIds);

  if (studios.length !== studioIds.length) {
    throw new AppError("STUDIO_4041");
  }

  const studioById = new Map(studios.map((studio) => [studio.id, studio]));
  const orderedStudios = studioIds.map((id) => studioById.get(id)!);

  const shootingPurposes = SHOOTING_PURPOSE_DISPLAY_ORDER.map(
    ({ shootingCategory, displayName }) => {
      const supportedStudioIds: bigint[] = [];
      const unsupportedStudios: { studioId: bigint; studioName: string }[] = [];

      for (const studio of orderedStudios) {
        const isSupported = studio.products.some(
          (product) => product.shootingCategory === shootingCategory,
        );

        if (isSupported) {
          supportedStudioIds.push(studio.id);
        } else {
          unsupportedStudios.push({
            studioId: studio.id,
            studioName: studio.name,
          });
        }
      }

      return {
        shootingCategory,
        displayName,
        supportedStudioIds,
        unsupportedStudios,
      };
    },
  );

  return createStudioComparePurposesResponse({
    studios: orderedStudios.map((studio) => ({
      studioId: studio.id,
      studioName: studio.name,
    })),
    shootingPurposes,
  });
}

// ========================================================
// ================= 사진관 비교 결과 조회 =================
// ========================================================

function toStartOfUtcDate(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  return startOfDay;
}

// reservation.service.ts의 isPastTimeSlot과 동일한 로직.
// (로컬 서버 타임존 기준으로 date/startTime을 합침 — UTC 서버 배포 시
// 오작동할 수 있는 알려진 이슈. reservation 도메인과 함께 추후 수정 필요)
function isPastTimeSlot(date: Date, startTime: Date, now = new Date()) {
  const slotStart = new Date(date);
  slotStart.setHours(
    startTime.getHours(),
    startTime.getMinutes(),
    startTime.getSeconds(),
    0,
  );

  return slotStart.getTime() < now.getTime();
}

// 사진관 비교 결과 조회 API
export async function getStudioCompareResult(
  rawStudioIds: string[],
  rawShootingCategory: string | undefined,
): Promise<StudioCompareResultResponseDto> {
  let query: GetStudioCompareResultQuery;

  try {
    query = parseGetStudioCompareResultRequest({
      studioIds: rawStudioIds,
      shootingCategory: rawShootingCategory,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const hasShootingCategoryError = error.issues.some(
        (issue) => issue.path[0] === "shootingCategory",
      );

      if (hasShootingCategoryError) {
        throw new AppError("STUDIO_4007");
      }

      const hasElementFormatError = error.issues.some(
        (issue) => issue.path[0] === "studioIds" && issue.path.length > 1,
      );

      throw new AppError(
        hasElementFormatError ? "STUDIO_40011" : "STUDIO_40013",
      );
    }

    throw error;
  }

  const { studioIds, shootingCategory } = query;

  const studios = await studioCompareRepository.findStudiosForCompareResult(
    studioIds,
    shootingCategory,
  );

  if (studios.length !== studioIds.length) {
    throw new AppError("STUDIO_4041");
  }

  // products가 빈 배열이면 해당 사진관이 이 shootingCategory를 지원하지 않는다는 뜻.
  // 프론트 요청을 신뢰하지 않고 여기서 다시 검증한다.
  const hasUnsupportedStudio = studios.some(
    (studio) => studio.products.length === 0,
  );

  if (hasUnsupportedStudio) {
    throw new AppError("STUDIO_4046");
  }

  const [reviewSummaries, slotCandidates] = await Promise.all([
    studioCompareRepository.findReviewSummariesByStudioIds(studioIds),
    studioCompareRepository.findAvailableTimeSlotCandidates(
      studioIds,
      toStartOfUtcDate(new Date()),
    ),
  ]);

  const reviewSummaryByStudioId = new Map(
    reviewSummaries.map((summary) => [summary.studioId, summary]),
  );

  const now = new Date();
  const earliestDateByStudioId = new Map<bigint, Date>();

  for (const slot of slotCandidates) {
    if (earliestDateByStudioId.has(slot.studioId)) {
      continue;
    }

    if (isPastTimeSlot(slot.date, slot.startTime, now)) {
      continue;
    }

    earliestDateByStudioId.set(slot.studioId, slot.date);
  }

  const studioById = new Map(studios.map((studio) => [studio.id, studio]));
  const orderedStudios = studioIds.map((id) => studioById.get(id)!);

  return createStudioCompareResultResponse({
    shootingCategory,
    displayName: getShootingPurposeDisplayName(shootingCategory),
    studios: orderedStudios.map((studio) => {
      const representativeProduct = studio.products[0]!;
      const hasPriceRange = studio.products.some(
        (product) => product.price !== representativeProduct.price,
      );
      const reviewSummary = reviewSummaryByStudioId.get(studio.id);

      return {
        studioId: studio.id,
        studioName: studio.name,
        thumbnailUrl: representativeProduct.productImages[0]?.url ?? null,
        rating:
          reviewSummary?._avg.rating === null ||
          reviewSummary?._avg.rating === undefined
            ? 0
            : Math.round(reviewSummary._avg.rating * 10) / 10,
        reviewCount: reviewSummary?._count._all ?? 0,
        productInformation: {
          minimumPrice: representativeProduct.price,
          hasPriceRange,
          comparisonSummary: representativeProduct.comparisonSummary,
          hasAdditionalPrice: representativeProduct.hasAdditionalPrice,
        },
        serviceTags: studio.studioServices.map((service) => service.serviceCode),
        location: studio.location,
        earliestReservationDate: earliestDateByStudioId.get(studio.id) ?? null,
      };
    }),
  });
}