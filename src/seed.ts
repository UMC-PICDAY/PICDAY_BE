import "dotenv/config";
import { prisma } from "./config/prisma.js";

const HTTP_TEST_DATE = new Date("2030-12-25T00:00:00.000Z");
const RESERVATION_TEST_DATE = new Date("2030-12-26T00:00:00.000Z");

function time(value: string) {
  return new Date(`1970-01-01T${value}Z`);
}

async function upsertStudio(name: string) {
  const existing = await prisma.studio.findFirst({
    where: { name },
    select: { id: true, name: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.studio.create({
    data: { name },
    select: { id: true, name: true },
  });
}

async function upsertProduct(
  studioId: bigint,
  data: {
    shootingCategory: "PROFILE" | "PERSONAL_PORTRAIT";
    name: string;
    price: number;
    basePeople: number;
    shortDescription: string | null;
  },
) {
  const existing = await prisma.studioProduct.findFirst({
    where: { studioId, name: data.name },
  });

  if (existing) {
    return prisma.studioProduct.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.studioProduct.create({
    data: { studioId, ...data },
  });
}

async function upsertTimeSlot(
  studioId: bigint,
  date: Date,
  startTime: Date,
  endTime: Date,
  isAvailable: boolean,
) {
  return prisma.timeSlot.upsert({
    where: {
      studioId_date_startTime_endTime: {
        studioId,
        date,
        startTime,
        endTime,
      },
    },
    update: { isAvailable },
    create: { studioId, date, startTime, endTime, isAvailable },
  });
}

async function upsertReservation(data: {
  userId: bigint;
  timeSlotId: bigint;
  studioProductId: bigint;
  reserveeName: string;
  reserveePhone: string;
  totalPrice: number;
  status: "RESERVED" | "CANCELLED" | "COMPLETED";
  canceledAt?: Date | null;
}) {
  const existing = await prisma.reservation.findFirst({
    where: {
      userId: data.userId,
      timeSlotId: data.timeSlotId,
      studioProductId: data.studioProductId,
      status: data.status,
    },
  });

  if (existing) {
    return prisma.reservation.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.reservation.create({ data });
}

async function main() {
  const user = await prisma.user.upsert({
    where: { loginId: "testuser01" },
    update: {
      password: "hashed-password",
      name: "홍길동",
      nickname: "테스트유저",
      email: "test@example.com",
      phoneNumber: "01012345678",
    },
    create: {
      loginId: "testuser01",
      password: "hashed-password",
      name: "홍길동",
      nickname: "테스트유저",
      email: "test@example.com",
      phoneNumber: "01012345678",
    },
  });

  const studioA = await upsertStudio("PICDAY HTTP 검증 A");
  const studioB = await upsertStudio("PICDAY HTTP 검증 B");
  const studioC = await upsertStudio("PICDAY HTTP 검증 C");

  const profileBasic = await upsertProduct(studioA.id, {
    shootingCategory: "PROFILE",
    name: "프로필 촬영 패키지",
    price: 50000,
    basePeople: 1,
    shortDescription: "기본 프로필 · 보정본 1매",
  });
  await upsertProduct(studioA.id, {
    shootingCategory: "PERSONAL_PORTRAIT",
    name: "개인 화보 패키지",
    price: 70000,
    basePeople: 2,
    shortDescription: "자연광 개인 화보 · 보정본 2매",
  });
  await upsertProduct(studioA.id, {
    shootingCategory: "PROFILE",
    name: "프리미엄 프로필 패키지",
    price: 90000,
    basePeople: 1,
    shortDescription: null,
  });

  for (const image of [
    { order: 2, url: "https://example.com/profile-second.jpg" },
    { order: 1, url: "https://example.com/profile-first.jpg" },
  ]) {
    await prisma.productImage.upsert({
      where: {
        studioProductId_order: {
          studioProductId: profileBasic.id,
          order: image.order,
        },
      },
      update: { url: image.url },
      create: {
        studioProductId: profileBasic.id,
        order: image.order,
        url: image.url,
      },
    });
  }

  const availableSlot = await upsertTimeSlot(
    studioA.id,
    HTTP_TEST_DATE,
    time("10:00:00.000"),
    time("11:00:00.000"),
    true,
  );
  const unavailableSlot = await upsertTimeSlot(
    studioA.id,
    HTTP_TEST_DATE,
    time("12:00:00.000"),
    time("13:00:00.000"),
    false,
  );
  const otherStudioSlot = await upsertTimeSlot(
    studioB.id,
    HTTP_TEST_DATE,
    time("14:00:00.000"),
    time("15:00:00.000"),
    true,
  );

  const reservationFutureSlot = await upsertTimeSlot(
    studioA.id,
    RESERVATION_TEST_DATE,
    time("10:00:00.000"),
    time("11:00:00.000"),
    false,
  );
  const shiftedNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const todayDate = new Date(
    Date.UTC(
      shiftedNow.getUTCFullYear(),
      shiftedNow.getUTCMonth(),
      shiftedNow.getUTCDate(),
    ),
  );
  const todaySlot = await upsertTimeSlot(
    studioA.id,
    todayDate,
    time("15:00:00.000"),
    time("16:00:00.000"),
    false,
  );

  const reservationBase = {
    userId: user.id,
    studioProductId: profileBasic.id,
    reserveeName: "홍길동",
    reserveePhone: "01012345678",
    totalPrice: profileBasic.price,
  };
  const normal = await upsertReservation({
    ...reservationBase,
    timeSlotId: reservationFutureSlot.id,
    status: "RESERVED",
  });
  const cancelled = await upsertReservation({
    ...reservationBase,
    timeSlotId: reservationFutureSlot.id,
    status: "CANCELLED",
    canceledAt: new Date(),
  });
  const completed = await upsertReservation({
    ...reservationBase,
    timeSlotId: reservationFutureSlot.id,
    status: "COMPLETED",
  });
  const sameDay = await upsertReservation({
    ...reservationBase,
    timeSlotId: todaySlot.id,
    status: "RESERVED",
  });

  console.log("✅ 시드 완료");
  console.log("HTTP 사진관 A ID       :", studioA.id.toString());
  console.log("HTTP 사진관 B ID       :", studioB.id.toString());
  console.log("HTTP 사진관 C ID       :", studioC.id.toString());
  console.log("미래 가용 슬롯 ID       :", availableSlot.id.toString());
  console.log("미래 마감 슬롯 ID       :", unavailableSlot.id.toString());
  console.log("다른 사진관 슬롯 ID   :", otherStudioSlot.id.toString());
  console.log("정상 취소용 예약 ID     :", normal.id.toString());
  console.log("이미 취소된 예약 ID     :", cancelled.id.toString());
  console.log("이미 완료된 예약 ID     :", completed.id.toString());
  console.log("당일 취소 대상 예약 ID  :", sameDay.id.toString());
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
