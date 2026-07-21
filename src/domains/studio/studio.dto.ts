import { z } from "zod";
import { ShootingCategory } from "../../generated/prisma/enums.js";

export const createStudioSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  address: z.string().min(1),
});

export type CreateStudioDto = z.infer<typeof createStudioSchema>;

// 예약 가능 시간 조회 API
const studioIdSchema = z
  .string()
  .regex(/^\d+$/, "사진관 ID는 양의 정수여야 합니다.")
  .transform((id) => BigInt(id))
  .refine((id) => id > 0n, "사진관 ID는 양의 정수여야 합니다.");

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function toDbDate(dateText: string) {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year!, month! - 1, day!);
  return date;
}

function isRealDate(dateText: string) {
  if (!datePattern.test(dateText)) {
    return false;
  }

  const [year, month, day] = dateText.split("-").map(Number);
  const date = toDbDate(dateText);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month! - 1 &&
    date.getUTCDate() === day
  );
}

const studioSlotsDateSchema = z
  .string()
  .regex(datePattern, "날짜는 YYYY-MM-DD 형식이어야 합니다.")
  .refine(isRealDate, "실제 존재하는 날짜를 입력해 주세요.");

export const getStudioSlotsRequestSchema = z
  .object({
    studioId: studioIdSchema,
    date: studioSlotsDateSchema,
  })
  .transform(({ studioId, date }) => ({
    studioId,
    dateText: date,
    dbDate: toDbDate(date),
  }));

export type GetStudioSlotsRequestDto = {
  studioId: string;
  date: string | undefined;
};

export type GetStudioSlotsQuery = z.output<typeof getStudioSlotsRequestSchema>;

export function parseGetStudioSlotsRequest(
  input: GetStudioSlotsRequestDto,
): GetStudioSlotsQuery {
  return getStudioSlotsRequestSchema.parse(input);
}

// 컨셉 목록 조회 API
const timeSlotIdSchema = z
  .string()
  .regex(/^\d+$/, "시간 슬롯 ID는 양의 정수여야 합니다.")
  .transform((id) => BigInt(id))
  .refine((id) => id > 0n, "시간 슬롯 ID는 양의 정수여야 합니다.");

export const getStudioProductsRequestSchema = z.object({
  studioId: studioIdSchema,
  timeSlotId: timeSlotIdSchema.optional(),
});

export type GetStudioProductsRequestDto = z.input<
  typeof getStudioProductsRequestSchema
>;

export type GetStudioProductsQuery = z.output<
  typeof getStudioProductsRequestSchema
>;

export function parseGetStudioProductsRequest(
  input: GetStudioProductsRequestDto,
): GetStudioProductsQuery {
  return getStudioProductsRequestSchema.parse(input);
}

function formatTime(date: Date) {
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDate(date: Date) {
  return [
    date.getUTCFullYear().toString().padStart(4, "0"),
    (date.getUTCMonth() + 1).toString().padStart(2, "0"),
    date.getUTCDate().toString().padStart(2, "0"),
  ].join("-");
}

export const studioSlotResponseSchema = z.object({
  slotId: z.bigint().transform((id) => id.toString()),
  startTime: z.date().transform(formatTime),
  endTime: z.date().transform(formatTime),
  isAvailable: z.boolean(),
});

export type StudioSlotResponseInputDto = z.input<
  typeof studioSlotResponseSchema
>;

export type StudioSlotResponseDto = z.output<typeof studioSlotResponseSchema>;

export const studioSlotsResponseSchema = z.array(studioSlotResponseSchema);

export type StudioSlotsResponseDto = z.output<typeof studioSlotsResponseSchema>;

export const getStudioSlotsSuccessResponseSchema = z.object({
  success: z.literal(true),
  code: z.literal("COMMON_200"),
  message: z.literal("예약 가능 시간 조회에 성공했습니다."),
  data: studioSlotsResponseSchema,
});

export type GetStudioSlotsSuccessResponseDto = z.output<
  typeof getStudioSlotsSuccessResponseSchema
>;

export const studioProductsSelectedSlotSchema = z.object({
  timeSlotId: z.bigint().transform((id) => id.toString()),
  date: z.date().transform(formatDate),
  startTime: z.date().transform(formatTime),
  endTime: z.date().transform(formatTime),
  isAvailable: z.boolean(),
});

export const studioProductListItemSchema = z
  .object({
    studioProductId: z.bigint().transform((id) => id.toString()),
    productName: z.string(),
    imageUrls: z.array(z.url()),
    price: z.number().int().nonnegative(),
    basePeople: z.number().int().min(1),
    shortDescription: z.string().nullable(),
  })
  .transform((product) => ({
    ...product,
    imageCount: product.imageUrls.length,
  }));

export const studioProductGroupSchema = z.object({
  shootingCategory: z.enum(ShootingCategory),
  products: z.array(studioProductListItemSchema),
});

export const studioProductsResponseSchema = z.object({
  studioId: z.bigint().transform((id) => id.toString()),
  studioName: z.string(),
  selectedSlot: studioProductsSelectedSlotSchema.nullable(),
  productGroups: z.array(studioProductGroupSchema),
});

export type StudioProductsResponseInputDto = z.input<
  typeof studioProductsResponseSchema
>;

export type StudioProductsResponseDto = z.output<
  typeof studioProductsResponseSchema
>;

export function createStudioProductsResponse(
  input: StudioProductsResponseInputDto,
): StudioProductsResponseDto {
  return studioProductsResponseSchema.parse(input);
}
