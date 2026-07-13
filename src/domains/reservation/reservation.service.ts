// reservation.service.ts
export async function cancel(reservationId: string) {
  // TODO: repository 연결 후 실제 로직 구현
  return { reservationId, status: "CANCELLED" as const };
}