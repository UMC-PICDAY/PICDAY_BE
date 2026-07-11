// reservation.dto.ts
import { z } from "zod";

export const reservationIdParamsSchema = z.object({
  reservationId: z.string().regex(/^\d+$/, "유효하지 않은 예약 ID입니다."),
});
export type ReservationIdParams = z.infer<typeof reservationIdParamsSchema>;

export const cancelReservationResponseSchema = z.object({
  reservationId: z.bigint().transform((id) => id.toString()),
  status: z.literal("CANCELLED"),
  canceledAt: z.date().transform((date) => date.toISOString()),
});
export type CancelReservationResponseDto = z.infer<typeof cancelReservationResponseSchema>;