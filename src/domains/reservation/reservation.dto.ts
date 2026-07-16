import { z } from "zod";

// 예약 생성 API
const requestIdSchema = z
  .number()
  .int("ID는 정수여야 합니다.")
  .positive("ID는 양수여야 합니다.")
  .max(Number.MAX_SAFE_INTEGER, "ID가 허용 범위를 초과했습니다.");

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
    studioId: BigInt(request.studioId),
    studioProductId: BigInt(request.studioProductId),
    timeSlotId: BigInt(request.timeSlotId),
    agreedTermIds: request.agreedTermIds.map((termId) => BigInt(termId)),
  };
}

export const createReservationResponseSchema = z.object({
  reservationId: z.bigint().transform((id) => id.toString()),
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

export const reservationIdParamsSchema = z.object({
  reservationId: z.string().regex(/^\d+$/, "유효하지 않은 예약 ID입니다."),
});
export type ReservationIdParams = z.infer<typeof reservationIdParamsSchema>;


// 예약 취소 API

export const cancelReservationResponseSchema = z.object({
  reservationId: z.bigint().transform((id) => id.toString()),
  status: z.literal("CANCELLED"),
  canceledAt: z.date().transform((date) => date.toISOString()),
});
export type CancelReservationResponseDto = z.infer<
  typeof cancelReservationResponseSchema
>;

// 예약 상세조회 API
export const getReservationDetailResponseSchema = z.object({
  reservationId: z.bigint().transform((id) => id.toString()),
  status: z.enum(["RESERVED", "COMPLETED", "CANCELLED"]),
  reserveeName: z.string(),
  reserveePhone: z.string(),
  totalPrice: z.number().int().nonnegative(),
  studio: z.object({
    id: z.bigint().transform((id)=>id.toString()),
    name: z.string(),
  }),
  studioProduct: z.object({
    id: z.bigint().transform((id) => id.toString()),
    name: z.string(),
    price: z.number().int().nonnegative(),
  }),
  timeSlot: z.object({
    date: z.date().transform((date) => date.toISOString().slice(0,10)),
    startTime: z.date().transform((date) => date.toISOString().slice(11, 16)),
    endTime: z.date().transform((date) => date.toISOString().slice(11, 16)),
  }),
  createdAt: z.date().transform((date) => date.toISOString()),
  canceledAt: z.date().nullable().transform((date) => date?.toISOString() ?? null),
});

export type GetReservationDetailDto = z.output<typeof getReservationDetailResponseSchema>;