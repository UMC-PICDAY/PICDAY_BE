import { z } from "zod";
import { ShootingCategory } from "../../generated/prisma/enums.js";

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
  studioId: z.bigint().transform((id) => id.toString()),
  studioName: z.string(),
});

const shootingPurposeCompareSchema = z.object({
  shootingCategory: z.enum(ShootingCategory),
  displayName: z.string(),
  supportedStudioIds: z.array(z.bigint().transform((id) => id.toString())),
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