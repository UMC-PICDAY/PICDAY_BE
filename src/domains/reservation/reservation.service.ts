import { AppError } from "../../common/error.js";

import { getReservationById, cancelReservation } from "./reservation.repository.js";

import { cancelReservationResponseSchema } from "./reservation.dto.js";

// ===============
// 예약 취소
// ===============

export async function cancel(reservationId: string) {
  
  // 예약이 존재하는지 확인
  const reservation = await getReservationById(reservationId);

  if (!reservation){ // 예약이 존재하지 않는다면
    throw new AppError("RESERVATION_4041");
  }

  if (reservation.status == 'CANCELLED'){ // 이미 취소된 예약이라면
    throw new AppError("RESERVATION_4092");
  }

  if (reservation.status == 'COMPLETED'){ // 이미 진행된 예약이라면
    throw new AppError("RESERVATION_4093");
  }

  // 촬영 당일 취소 시 로직

  const updated = await cancelReservation(reservationId);

  return cancelReservationResponseSchema.parse({
    reservationId: updated.id,
    status: updated.status,
    canceledAt: updated.canceledAt,
  });  
}