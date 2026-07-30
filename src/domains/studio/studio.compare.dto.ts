import { z } from "zod";
import { 
  LocationCategory,
  ServiceCode,
  ShootingCategory
} from "../../generated/prisma/enums.js";
import { toApiId } from "../../common/apiId.js";

// ========================================================
// ================= 사진관 촬영 목적 비교 조회 =================
// ========================================================

// D-1 화면에 고정된 순서로 노출할 촬영 목적 + 한글 표시명
export const SHOOTING_PURPOSE_DISPLAY_ORDER: {
  shootingCategory: ShootingCategory;
  displayName: string;
}[] = [
  { shootingCategory: "ID_PHOTO", displayName: "증명" },
  { shootingCategory: "PROFILE", displayName: "프로필" },
  { shootingCategory: "PERSONAL_PORTRAIT", displayName: "개인화보" },
  { shootingCategory: "JOB_PHOTO", displayName: "취업" },
  { shootingCategory: "FAMILY", displayName: "가족" },
  { shootingCategory: "FRIENDSHIP", displayName: "우정" },
];

// ======== 요청 ========
// 개별 studioId 문자열 형식 검증은 미들웨어(validateStudioCompareRequestIds)에서
// 먼저 걸러지므로, 여기서는 개수(2~3개) / 중복 여부만 재검증한다.
const compareStudioIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "사진관 ID는 양의 정수 문자열이어야 합니다.")
  .transform((id) => BigInt(id));

export const getStudioComparePurposesRequestSchema = z
  .object({
    studioIds: z.array(compareStudioIdSchema).min(2).max(3),
  })
  .refine((data) => new Set(data.studioIds).size === data.studioIds.length, {
    message: "중복된 사진관 ID가 포함되어 있습니다.",
    path: ["studioIds"],
  });

export type GetStudioComparePurposesQuery = z.output<typeof getStudioComparePurposesRequestSchema>;

export function parseGetStudioComparePurposesRequest(input: {
  studioIds: string[];
}): GetStudioComparePurposesQuery {
  return getStudioComparePurposesRequestSchema.parse(input);
}

// ======== 응답 ========
const compareStudioSchema = z.object({
  studioId: z.bigint().transform(toApiId),
  studioName: z.string(),
});

const shootingPurposeCompareSchema = z.object({
  shootingCategory: z.enum(ShootingCategory),
  displayName: z.string(),
  supportedStudioIds: z.array(z.bigint().transform(toApiId)),
  unsupportedStudios: z.array(compareStudioSchema),
});

export const studioComparePurposesResponseSchema = z.object({
  studios: z.array(compareStudioSchema),
  shootingPurposes: z.array(shootingPurposeCompareSchema),
});

export type StudioComparePurposesResponseInputDto = z.input<typeof studioComparePurposesResponseSchema>;

export type StudioComparePurposesResponseDto = z.output<typeof studioComparePurposesResponseSchema>;

export function createStudioComparePurposesResponse(
  input: StudioComparePurposesResponseInputDto,
): StudioComparePurposesResponseDto {
  return studioComparePurposesResponseSchema.parse(input);
}

// ========================================================
// ================= 사진관 비교 결과 조회 =================
// ========================================================

const SHOOTING_PURPOSE_DISPLAY_NAME_BY_CATEGORY = new Map(
  SHOOTING_PURPOSE_DISPLAY_ORDER.map(({ shootingCategory, displayName }) => [
    shootingCategory,
    displayName,
  ]),
);

export function getShootingPurposeDisplayName(
  shootingCategory: ShootingCategory,
): string {
  return SHOOTING_PURPOSE_DISPLAY_NAME_BY_CATEGORY.get(shootingCategory)!;
}

// ======== 요청 ========
export const getStudioCompareResultRequestSchema = z
  .object({
    studioIds: z.array(compareStudioIdSchema).min(2).max(3),
    shootingCategory: z.enum(ShootingCategory),
  })
  .refine((data) => new Set(data.studioIds).size === data.studioIds.length, {
    message: "중복된 사진관 ID가 포함되어 있습니다.",
    path: ["studioIds"],
  });

export type GetStudioCompareResultQuery = z.output<typeof getStudioCompareResultRequestSchema>;

export function parseGetStudioCompareResultRequest(input: {
  studioIds: string[];
  shootingCategory: string | undefined;
}): GetStudioCompareResultQuery {
  return getStudioCompareResultRequestSchema.parse(input);
}

// ======== 응답 ========
function formatDateOnly(date: Date) {
  return [
    date.getUTCFullYear().toString().padStart(4, "0"),
    (date.getUTCMonth() + 1).toString().padStart(2, "0"),
    date.getUTCDate().toString().padStart(2, "0"),
  ].join("-");
}

const compareResultLocationSchema = z
  .object({
    locationCategory: z.enum(LocationCategory),
    nearestStation: z.string(),
    walkingMinutes: z.number().int().nonnegative(),
  })
  .nullable();

const compareResultProductInformationSchema = z.object({
  minimumPrice: z.number().int().nonnegative(),
  hasPriceRange: z.boolean(),
  comparisonSummary: z.string().nullable(),
  hasAdditionalPrice: z.boolean(),
});

const compareResultStudioSchema = z.object({
  studioId: z.bigint().transform(toApiId),
  studioName: z.string(),
  thumbnailUrl: z.url().nullable(),
  rating: z.number().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
  productInformation: compareResultProductInformationSchema,
  serviceTags: z.array(z.enum(ServiceCode)),
  location: compareResultLocationSchema,
  earliestReservationDate: z
    .date()
    .nullable()
    .transform((date) => (date ? formatDateOnly(date) : null)),
});

export const studioCompareResultResponseSchema = z.object({
  shootingCategory: z.enum(ShootingCategory),
  displayName: z.string(),
  studios: z.array(compareResultStudioSchema),
});

export type StudioCompareResultResponseInputDto = z.input<typeof studioCompareResultResponseSchema>;

export type StudioCompareResultResponseDto = z.output<typeof studioCompareResultResponseSchema>;

export function createStudioCompareResultResponse(
  input: StudioCompareResultResponseInputDto,
): StudioCompareResultResponseDto {
  return studioCompareResultResponseSchema.parse(input);
}
