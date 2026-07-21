import { ZodError } from "zod";
import { AppError } from "../../common/error.js";
import {
  parseGetStudioProductDetailRequest,
  parseGetStudioSlotsRequest,
  studioProductDetailResponseSchema,
  studioSlotsResponseSchema,
  type GetStudioProductDetailQuery,
  type GetStudioSlotsQuery,
  type StudioProductDetailResponseDto,
  type StudioSlotsResponseDto,
} from "./studio.dto.js";
import * as studioRepository from "./studio.repository.js";

const KST_OFFSET_MILLISECONDS = 9 * 60 * 60 * 1000;

type NowProvider = () => Date;

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

    const studio = await studioRepository.findStudioWithTimeSlotsByDate(
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
            getTimeSeconds(slot.startTime) > kstNow.secondsSinceMidnight),
      })),
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("STUDIO_5001");
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
        throw new AppError(hasStudioIdError ? "STUDIO_40011" : "STUDIO_4006");
      }
      throw error;
    }

    const studio = await studioRepository.findStudioForProductDetail(
      query.studioId,
    );

    if (!studio) {
      throw new AppError("STUDIO_4041");
    }

    const product = await studioRepository.findStudioProductDetailById(
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
      imageUrls: product.productImages.map((image) => image.url),
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("COMMON_500");
  }
}
