import { prisma } from "../../config/prisma.js";

// 예약 ID를 통한 예약 정보 가져오기
export const getReservationById = async (reservationId: bigint) => {
    return await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: {
            timeSlot: true,
            studioProduct: true,
        },
    });
};

// 예약 취소
export const cancelReservation = async (reservationId: bigint) => {
    return await prisma.reservation.update({
        where: {id: reservationId},
        data: {
            status: "CANCELLED",
            canceledAt: new Date()
        },
    });
}