import { AppError } from "../../common/error.js";
import {
  createStudioAutocompleteResponse,
  parseGetStudioAutocompleteRequest,
  type StudioAutocompleteResponseDto,
} from "./studio.search.dto.js";
import * as studioSearchRepository from "./studio.search.repository.js";

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

// === 사진관 자동완성 검색 API ===
export async function getStudioAutocomplete(
  rawKeyword: string,
): Promise<StudioAutocompleteResponseDto> {
  try {
    const { keyword } = parseGetStudioAutocompleteRequest({
      keyword: rawKeyword,
    });

    const studios =
      await studioSearchRepository.findStudiosByNameKeyword(keyword);

    return createStudioAutocompleteResponse({
      keyword,
      suggestions: studios.map((studio) => {
        const category = studio.location?.locationCategory;

        return {
          studioId: studio.id,
          studioName: studio.name,
          locationCategory: category
            ? (LOCATION_CATEGORY_LABELS[category] ?? category)
            : "",
        };
      }),
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("COMMON_500");
  }
}
