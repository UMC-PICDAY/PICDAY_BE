// src/seed.ts
// 시드데이터 확인 : pnpm exec tsx src/seed.ts
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
    select: {
      id: true,
      name: true,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.studio.create({
    data: { name },
    select: {
      id: true,
      name: true,
    },
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
    where: {
      studioId,
      name: data.name,
    },
  });

  if (existing) {
    return prisma.studioProduct.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.studioProduct.create({
    data: {
      studioId,
      ...data,
    },
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
    update: {
      isAvailable,
    },
    create: {
      studioId,
      date,
      startTime,
      endTime,
      isAvailable,
    },
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

  return prisma.reservation.create({
    data,
  });
}

async function main() {
  const user = await prisma.user.upsert({
    where: {
      loginId: "testuser01",
    },
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

  await prisma.studioLocation.upsert({
    where: { studioId: studioA.id },
    update: {},
    create: {
      studioId: studioA.id,
      mainAddress: "서울 마포구 동교동",
      subAddress: "홍대입구역 인근",
      locationCategory: "HONGDAE",
      nearestStation: "홍대입구역",
      walkingMinutes: 5,
    },
  });

  await prisma.studioLocation.upsert({
    where: { studioId: studioB.id },
    update: {},
    create: {
      studioId: studioB.id,
      mainAddress: "서울 마포구 서교동",
      subAddress: "홍대입구역 인근",
      locationCategory: "HONGDAE",
      nearestStation: "홍대입구역",
      walkingMinutes: 8,
    },
  });

  await prisma.studioLocation.upsert({
    where: { studioId: studioC.id },
    update: {},
    create: {
      studioId: studioC.id,
      mainAddress: "서울 강남구 역삼동",
      subAddress: "강남역 인근",
      locationCategory: "GANGNAM",
      nearestStation: "강남역",
      walkingMinutes: 3,
    },
  });

  const profileBasic = await upsertProduct(studioA.id, {
    shootingCategory: "PROFILE",
    name: "프로필 촬영 패키지",
    price: 50000,
    basePeople: 1,
    shortDescription: "기본 프로필 · 보정본 1매",
  });

  const personalPortrait = await upsertProduct(studioA.id, {
    shootingCategory: "PERSONAL_PORTRAIT",
    name: "개인 화보 패키지",
    price: 70000,
    basePeople: 2,
    shortDescription: "자연광 개인 화보 · 보정본 2매",
  });

  const premiumProfile = await upsertProduct(studioA.id, {
    shootingCategory: "PROFILE",
    name: "프리미엄 프로필 패키지",
    price: 90000,
    basePeople: 1,
    shortDescription: null,
  });

  const otherStudioProduct = await upsertProduct(studioB.id, {
    shootingCategory: "PROFILE",
    name: "타 사진관 프로필 패키지",
    price: 60000,
    basePeople: 1,
    shortDescription: "다른 사진관 소속 상품",
  });

  for (const image of [
    {
      order: 2,
      url: "https://example.com/profile-second.jpg",
    },
    {
      order: 1,
      url: "https://example.com/profile-first.jpg",
    },
    {
      order: 3,
      url: "https://example.com/profile-third.jpg",
    },
  ]) {
    await prisma.productImage.upsert({
      where: {
        studioProductId_order: {
          studioProductId: profileBasic.id,
          order: image.order,
        },
      },
      update: {
        url: image.url,
      },
      create: {
        studioProductId: profileBasic.id,
        order: image.order,
        url: image.url,
      },
    });
  }

  for (const image of [
    {
      order: 1,
      url: "https://example.com/personal-portrait-first.jpg",
    },
    {
      order: 2,
      url: "https://example.com/personal-portrait-second.jpg",
    },
  ]) {
    await prisma.productImage.upsert({
      where: {
        studioProductId_order: {
          studioProductId: personalPortrait.id,
          order: image.order,
        },
      },
      update: {
        url: image.url,
      },
      create: {
        studioProductId: personalPortrait.id,
        order: image.order,
        url: image.url,
      },
    });
  }

  await prisma.productImage.upsert({
    where: {
      studioProductId_order: {
        studioProductId: otherStudioProduct.id,
        order: 1,
      },
    },
    update: {
      url: "https://example.com/other-studio-profile.jpg",
    },
    create: {
      studioProductId: otherStudioProduct.id,
      order: 1,
      url: "https://example.com/other-studio-profile.jpg",
    },
  });

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

  const normalReservation = await upsertReservation({
    ...reservationBase,
    timeSlotId: reservationFutureSlot.id,
    status: "RESERVED",
  });

  const cancelledReservation = await upsertReservation({
    ...reservationBase,
    timeSlotId: reservationFutureSlot.id,
    status: "CANCELLED",
    canceledAt: new Date(),
  });

  const completedReservation = await upsertReservation({
    ...reservationBase,
    timeSlotId: reservationFutureSlot.id,
    status: "COMPLETED",
  });

  const sameDayReservation = await upsertReservation({
    ...reservationBase,
    timeSlotId: todaySlot.id,
    status: "RESERVED",
  });

  // B에 완료 예약 2건 추가 -> 예약완료건수 A=1, B=2, C=0
  const studioBSlot1 = await upsertTimeSlot(
    studioB.id,
    RESERVATION_TEST_DATE,
    time("11:00:00.000"),
    time("12:00:00.000"),
    false,
  );
  const studioBSlot2 = await upsertTimeSlot(
    studioB.id,
    RESERVATION_TEST_DATE,
    time("13:00:00.000"),
    time("14:00:00.000"),
    false,
  );

  const studioBReservationBase = {
    userId: user.id,
    studioProductId: otherStudioProduct.id,
    reserveeName: "홍길동",
    reserveePhone: "01012345678",
    totalPrice: otherStudioProduct.price,
  };

  const studioBCompletedReservation1 = await upsertReservation({
    ...studioBReservationBase,
    timeSlotId: studioBSlot1.id,
    status: "COMPLETED",
  });

  const studioBCompletedReservation2 = await upsertReservation({
    ...studioBReservationBase,
    timeSlotId: studioBSlot2.id,
    status: "COMPLETED",
  });

  // 완료된 예약에 리뷰를 달았음 -> 평균 평점(A=4점, B=5점, C=리뷰없음→0점)
  await prisma.review.upsert({
    where: { reservationId: completedReservation.id },
    update: { rating: 4 },
    create: {
      reservationId: completedReservation.id,
      userId: user.id,
      studioId: studioA.id,
      rating: 4,
      content: "만족스러운 촬영이었어요. 사진 퀄리티도 좋고 친절했습니다.",
    },
  });

  await prisma.review.upsert({
    where: { reservationId: studioBCompletedReservation1.id },
    update: { rating: 5 },
    create: {
      reservationId: studioBCompletedReservation1.id,
      userId: user.id,
      studioId: studioB.id,
      rating: 5,
      content: "정말 최고의 촬영 경험이었습니다. 강력 추천해요!",
    },
  });

  await prisma.review.upsert({
    where: { reservationId: studioBCompletedReservation2.id },
    update: { rating: 5 },
    create: {
      reservationId: studioBCompletedReservation2.id,
      userId: user.id,
      studioId: studioB.id,
      rating: 5,
      content: "두 번째 방문인데도 여전히 만족스러웠어요.",
    },
  });

  console.log("✅ 시드 완료");

  console.log("\n--- 사진관 및 컨셉 API 테스트용 ---");
  console.log("사진관 A ID                 :", studioA.id.toString());
  console.log("사진관 B ID                 :", studioB.id.toString());
  console.log("사진관 C ID                 :", studioC.id.toString());
  console.log("기본 프로필 상품 ID         :", profileBasic.id.toString());
  console.log("개인 화보 상품 ID           :", personalPortrait.id.toString());
  console.log("이미지 없는 상품 ID         :", premiumProfile.id.toString());
  console.log("다른 사진관 소속 상품 ID   :", otherStudioProduct.id.toString());

  console.log("\n--- 예약 가능 시간 API 테스트용 ---");
  console.log("테스트 날짜                 : 2030-12-25");
  console.log("미래 가용 슬롯 ID           :", availableSlot.id.toString());
  console.log("미래 마감 슬롯 ID           :", unavailableSlot.id.toString());
  console.log("다른 사진관 슬롯 ID         :", otherStudioSlot.id.toString());

  console.log("\n--- 예약 API 테스트용 ---");
  console.log("정상 취소용 예약 ID         :", normalReservation.id.toString());
  console.log(
    "이미 취소된 예약 ID         :",
    cancelledReservation.id.toString(),
  );
  console.log(
    "이미 완료된 예약 ID         :",
    completedReservation.id.toString(),
  );
  console.log(
    "당일 취소 대상 예약 ID      :",
    sameDayReservation.id.toString(),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
