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

  const studio = await prisma.studio.create({
    data: { name: "PICDAY 홍대점", introduction: "홍대 인근 사진관" },
  });

  const studio2 = await prisma.studio.create({
    data: { name: "데이지 스튜디오", introduction: "성수 감성 스튜디오" },
  });

  const product = await prisma.studioProduct.create({
  data: {
    studioId: studio.id,
    shootingCategory: "PROFILE",
    name: "프로필 촬영 패키지",
    price: 50000,
    basePeople: 1,   // 추가
  },
});

const product2 = await prisma.studioProduct.create({
  data: {
    studioId: studio2.id,
    shootingCategory: "PERSONAL_PORTRAIT",
    name: "개인화보",
    price: 150000,
    basePeople: 1,   // 추가
  },
});

  // 미래 타임슬롯 (정상 취소/목록 테스트용)
  const futureSlot = await prisma.timeSlot.create({
    data: {
      studioId: studio.id,
      date: new Date("2026-12-25"),
      startTime: new Date("1970-01-01T10:00:00Z"),
      endTime: new Date("1970-01-01T11:00:00Z"),
    },
  });

  const futureSlot2 = await prisma.timeSlot.create({
    data: {
      studioId: studio2.id,
      date: new Date("2026-07-15"),
      startTime: new Date("1970-01-01T14:00:00Z"),
      endTime: new Date("1970-01-01T15:00:00Z"),
    },
  });

  // 과거 타임슬롯 (완료된 예약 테스트용)
  const pastSlot = await prisma.timeSlot.create({
    data: {
      studioId: studio2.id,
      date: new Date("2026-06-20"),
      startTime: new Date("1970-01-01T10:00:00Z"),
      endTime: new Date("1970-01-01T11:00:00Z"),
    },
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
    reserveeName: "홍길동",
    reserveePhone: "01012345678",
  };

  // 1. 정상 취소 가능 (RESERVED, 미래 날짜)
  const normal = await prisma.reservation.create({
    data: {
      ...base,
      studioProductId: product.id,
      timeSlotId: futureSlot.id,
      totalPrice: 50000,
      status: "RESERVED",
    },
  });

  // 2. 이미 취소됨 (4092 테스트용 + 목록 CANCELLED 필터용)
  const cancelled = await prisma.reservation.create({
    data: {
      ...base,
      studioProductId: product.id,
      timeSlotId: futureSlot.id,
      totalPrice: 50000,
      status: "CANCELLED",
      canceledAt: new Date(),
    },
  });

  // 3. 이미 완료됨 (4093 테스트용 + 목록 COMPLETED 필터용)
  const completed = await prisma.reservation.create({
    data: {
      ...base,
      studioProductId: product2.id,
      timeSlotId: pastSlot.id,
      totalPrice: 150000,
      status: "COMPLETED",
    },
  });

  // 4. 당일 취소 시도 대상 (4002 테스트용)
  const sameDay = await prisma.reservation.create({
    data: {
      ...base,
      studioProductId: product.id,
      timeSlotId: todaySlot.id,
      totalPrice: 50000,
      status: "RESERVED",
    },
  });

  // 5. 다른 스튜디오의 예약 (목록 조회 시 여러 스튜디오 섞여 나오는지 확인용)
  const anotherStudio = await prisma.reservation.create({
    data: {
      ...base,
      studioProductId: product2.id,
      timeSlotId: futureSlot2.id,
      totalPrice: 150000,
      status: "RESERVED",
    },
  });

  // 6. 다른 유저의 예약 (내 예약 목록에 안 섞여 나오는지 확인용 — ownership 검증)
  const otherUser = await prisma.user.create({
    data: {
      loginId: "testuser02",
      password: "hashed-password",
      name: "김철수",
      nickname: "테스트유저2",
      email: "test2@example.com",
      phoneNumber: "01087654321",
    },
  });
  const otherUsersReservation = await prisma.reservation.create({
    data: {
      userId: otherUser.id,
      studioProductId: product.id,
      timeSlotId: futureSlot.id,
      reserveeName: "김철수",
      reserveePhone: "01087654321",
      totalPrice: 50000,
      status: "RESERVED",
    },
  });

  console.log("✅ 시드 완료");
  console.log("--- 취소 API 테스트용 ---");
  console.log("정상 취소용 id     :", normal.id.toString());
  console.log("이미 취소됨 id     :", cancelled.id.toString());
  console.log("이미 완료됨 id     :", completed.id.toString());
  console.log("당일취소 대상 id   :", sameDay.id.toString());
  console.log("존재하지 않는 id   : 999999 (실제로 없는 값)");
  console.log("--- 목록 조회 API 테스트용 ---");
  console.log("testuser01 (id=" + user.id.toString() + ") 예약 5건: RESERVED x3, CANCELLED x1, COMPLETED x1");
  console.log("다른 스튜디오 예약 id:", anotherStudio.id.toString());
  console.log("testuser02 (id=" + otherUser.id.toString() + ") 소유 예약 id:", otherUsersReservation.id.toString(), "(내 목록에 안 나와야 함)");
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