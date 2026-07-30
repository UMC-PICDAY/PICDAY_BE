import { z } from "zod";
import { isValidApiIdNumber, toApiId, toDomainId } from "../../common/apiId.js";

export const reservationStatusEnum = z.enum([
  "RESERVED",
  "COMPLETED",
  "CANCELLED",
]);
export type ReservationStatus = z.infer<typeof reservationStatusEnum>;

// 예약 생성 API
const requestIdSchema = z
  .number()
  .refine(isValidApiIdNumber, "ID는 안전한 양의 정수여야 합니다.");

export const paymentMethodSchema = z.enum([
  "KAKAOPAY",
  "NAVERPAY",
  "TOSSPAY",
  "TRANSFER",
  "CARD",
]);

export const createReservationRequestSchema = z
  .object({
    studioId: requestIdSchema,
    studioProductId: requestIdSchema,
    timeSlotId: requestIdSchema,
    reserveeName: z
      .string()
      .trim()
      .min(1, "예약자 이름을 입력해 주세요.")
      .max(50, "예약자 이름은 50자 이하여야 합니다."),
    reserveePhone: z
      .string()
      .regex(/^\d+$/, "예약자 연락처는 숫자만 입력해 주세요.")
      .regex(/^01[016789]\d{7,8}$/, "유효한 휴대전화 번호를 입력해 주세요."),
    paymentMethod: paymentMethodSchema,
    agreedTermIds: z
      .array(requestIdSchema)
      .min(1, "동의한 약관 ID를 하나 이상 입력해 주세요.")
      .refine(
        (termIds) => new Set(termIds).size === termIds.length,
        "동일한 약관 ID를 중복해서 입력할 수 없습니다.",
      ),
  })
  .strict();

export type CreateReservationRequestDto = z.infer<
  typeof createReservationRequestSchema
>;

export type CreateReservationCommand = Omit<
  CreateReservationRequestDto,
  "studioId" | "studioProductId" | "timeSlotId" | "agreedTermIds"
> & {
  studioId: bigint;
  studioProductId: bigint;
  timeSlotId: bigint;
  agreedTermIds: bigint[];
};

export function parseCreateReservationRequest(
  body: unknown,
): CreateReservationCommand {
  const request = createReservationRequestSchema.parse(body);

  return {
    ...request,
    studioId: toDomainId(request.studioId),
    studioProductId: toDomainId(request.studioProductId),
    timeSlotId: toDomainId(request.timeSlotId),
    agreedTermIds: request.agreedTermIds.map(toDomainId),
  };
}

export const createReservationResponseSchema = z.object({
  reservationId: z.bigint().transform(toApiId),
  status: z.literal("RESERVED"),
  totalPrice: z.number().int().nonnegative(),
  createdAt: z.date().transform((date) => date.toISOString()),
});

export type CreateReservationResponseDto = z.output<
  typeof createReservationResponseSchema
>;

export const createReservationSuccessResponseSchema = z.object({
  success: z.literal(true),
  code: z.literal("COMMON_201"),
  message: z.literal("예약이 성공적으로 완료되었습니다."),
  data: createReservationResponseSchema,
});

export type CreateReservationSuccessResponseDto = z.output<
  typeof createReservationSuccessResponseSchema
>;

// 파라미터 검증
export const reservationIdParamsSchema = z.object({
  reservationId: z
    .number()
    .refine(isValidApiIdNumber, "유효하지 않은 예약 ID입니다.")
    .transform(toDomainId),
});
export type ReservationIdParams = z.infer<typeof reservationIdParamsSchema>;

// 예약 취소 API

export const cancelReservationResponseSchema = z.object({
  reservationId: z.bigint().transform(toApiId),
  status: z.literal("CANCELLED"),
  canceledAt: z.date().transform((date) => date.toISOString()),
});
export type CancelReservationResponseDto = z.infer<
  typeof cancelReservationResponseSchema
>;

// 예약 상세조회 API

export const getReservationDetailResponseSchema = z.object({
  reservationId: z.bigint().transform(toApiId),
  status: reservationStatusEnum,
  reserveeName: z.string(),
  reserveePhone: z.string(),
  totalPrice: z.number().int().nonnegative(),
  studio: z.object({
    id: z.bigint().transform(toApiId),
    name: z.string(),
  }),
  studioProduct: z.object({
    id: z.bigint().transform(toApiId),
    name: z.string(),
    price: z.number().int().nonnegative(),
  }),
  timeSlot: z.object({
    date: z.date().transform((date) => date.toISOString().slice(0, 10)),
    startTime: z.date().transform((date) => date.toISOString().slice(11, 16)),
    endTime: z.date().transform((date) => date.toISOString().slice(11, 16)),
  }),
  reviewId: z
    .bigint()
    .nullable()
    .transform((id) => (id === null ? null : toApiId(id))),
  checklist: z.array(z.string()),
  createdAt: z.date().transform((date) => date.toISOString()),
  canceledAt: z
    .date()
    .nullable()
    .transform((date) => date?.toISOString() ?? null),
});

export type GetReservationDetailResponseDto = z.infer<
  typeof getReservationDetailResponseSchema
>;

// 내 예약 조회 API

// 쿼리 string 검증
export const getMyReservationListQuerySchema = z.object({
  status: reservationStatusEnum.optional(),
});

export type GetMyReservationsQuery = z.infer<
  typeof getMyReservationListQuerySchema
>;

export const getMyReservationListResponseSchema = z.array(
  z.object({
    reservationId: z.bigint().transform(toApiId),
    studioName: z.string(),
    thumbnailUrl: z.url().nullable(),
    conceptName: z.string(),
    reservationDate: z.date().transform((d) => d.toISOString().slice(0, 10)),
    reservationTime: z.string(),
    totalPrice: z.number(),
    status: reservationStatusEnum,
    reviewId: z
      .bigint()
      .nullable()
      .transform((id) => (id === null ? null : toApiId(id))),
  }),
);

export type GetMyReservationListResponseDto = z.infer<
  typeof getMyReservationListResponseSchema
>;
