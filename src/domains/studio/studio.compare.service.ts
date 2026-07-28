import { ZodError } from "zod";
import { AppError } from "../../common/error.js";
import * as studioCompareRepository from "./studio.compare.repository.js";
import {
  SHOOTING_PURPOSE_DISPLAY_ORDER,
  createStudioComparePurposesResponse,
  parseGetStudioComparePurposesRequest,
  type GetStudioComparePurposesQuery,
  type StudioComparePurposesResponseDto,
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
      // 개별 studioId 형식 오류(배열 원소 단위)는 STUDIO_40011,
      // 개수(2~3개) / 중복 오류는 STUDIO_40013으로 구분한다.
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

  // 응답의 studios 배열은 요청받은 studioIds 순서를 그대로 유지해야 한다.
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