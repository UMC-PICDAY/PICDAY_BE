// src/seed.ts
// 시드데이터 확인 : pnpm exec tsx src/seed.ts
import "dotenv/config";
import bcrypt from "bcrypt";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "./config/prisma.js";
import type { TermsScope, TermsType } from "./generated/prisma/client.js";

// 약관 원본(.md)은 repo 루트 terms/auth 에 있고, seed가 읽어 DB content로 넣는다.
const TERMS_AUTH_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "terms",
  "auth",
);

// 예약 약관 원본(.md)은 repo 루트 terms/reservation 에 있음
const TERMS_RESERVATION_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "terms",
  "reservation",
);

// 메타데이터는 여기서 타입 안전하게 관리, 본문은 .md 파일에서 로드
const AUTH_TERMS: ReadonlyArray<{
  type: TermsType;
  scope: TermsScope;
  version: string;
  isRequired: boolean;
  file: string;
}> = [
  {
    type: "SERVICE",
    scope: "SIGNUP",
    version: "v1",
    isRequired: true,
    file: "service.md",
  },
  {
    type: "PRIVACY_COLLECTION",
    scope: "SIGNUP",
    version: "v1",
    isRequired: true,
    file: "privacy.md",
  },
  {
    type: "AGE_OVER_14",
    scope: "SIGNUP",
    version: "v1",
    isRequired: true,
    file: "over14.md",
  },
  {
    type: "MARKETING",
    scope: "SIGNUP",
    version: "v1",
    isRequired: false,
    file: "marketing.md",
  },
];

// 예약 생성 시 필요한 필수 약관 (scope: RESERVATION)
// PRIVACY_COLLECTION은 AUTH_TERMS 쪽과 내용이 달라 version을 구분함 (type_version 유니크 제약)
const RESERVATION_TERMS: ReadonlyArray<{
  type: TermsType;
  scope: TermsScope;
  version: string;
  isRequired: boolean;
  file: string;
}> = [
  {
    type: "REFUND_POLICY",
    scope: "RESERVATION",
    version: "v1",
    isRequired: true,
    file: "refund.md",
  },
  {
    type: "PRIVACY_COLLECTION",
    scope: "RESERVATION",
    version: "v1-reserv",
    isRequired: true,
    file: "privacy.md",
  },
  {
    type: "THIRD_PARTY",
    scope: "RESERVATION",
    version: "v1",
    isRequired: true,
    file: "third_party.md",
  },
  {
    type: "PAYMENT_AGENCY",
    scope: "RESERVATION",
    version: "v1",
    isRequired: true,
    file: "payment_agency.md",
  },
];

async function seedAuthTerms() {
  const seeded: { type: TermsType; id: bigint }[] = [];

  for (const term of AUTH_TERMS) {
    const content = readFileSync(
      join(TERMS_AUTH_DIR, term.file),
      "utf-8",
    ).trim();

    // (type, version) 유니크 기준 upsert — 재실행해도 중복 생성되지 않음
    const row = await prisma.terms.upsert({
      where: { type_version: { type: term.type, version: term.version } },
      update: {
        content,
        scope: term.scope,
        isRequired: term.isRequired,
      },
      create: {
        type: term.type,
        scope: term.scope,
        version: term.version,
        isRequired: term.isRequired,
        content,
      },
      select: { id: true, type: true },
    });

    seeded.push(row);
  }

  return seeded;
}

async function seedReservationTerms() {
  const seeded: { type: TermsType; id: bigint }[] = [];

  for (const term of RESERVATION_TERMS) {
    const content = readFileSync(
      join(TERMS_RESERVATION_DIR, term.file),
      "utf-8",
    ).trim();

    // (type, version) 유니크 기준 upsert — 재실행해도 중복 생성되지 않음
    const row = await prisma.terms.upsert({
      where: { type_version: { type: term.type, version: term.version } },
      update: {
        content,
        scope: term.scope,
        isRequired: term.isRequired,
      },
      create: {
        type: term.type,
        scope: term.scope,
        version: term.version,
        isRequired: term.isRequired,
        content,
      },
      select: { id: true, type: true },
    });

    seeded.push(row);
  }

  return seeded;
}

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

async function upsertHairMakeupDetail(
  studioServiceId: bigint,
  data: {
    partnerName: string;
    additionalPrice: number;
    displayOrder: number;
  },
) {
  const existing = await prisma.studioHairMakeupDetail.findFirst({
    where: {
      studioServiceId,
      partnerName: data.partnerName,
    },
  });

  if (existing) {
    return prisma.studioHairMakeupDetail.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.studioHairMakeupDetail.create({
    data: {
      studioServiceId,
      ...data,
    },
  });
}

async function upsertInfoSection(title: string) {
  const existing = await prisma.infoSection.findFirst({
    where: { title },
  });

  if (existing) {
    return existing;
  }

  return prisma.infoSection.create({
    data: { title },
  });
}

async function upsertReviewImage(reviewId: bigint, url: string) {
  const existing = await prisma.reviewImage.findFirst({
    where: {
      reviewId,
      url,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.reviewImage.create({
    data: {
      reviewId,
      url,
    },
  });
}

// Postman 등에서 로그인 테스트용으로 쓸 평문 비밀번호. 아래 seed 유저들이 모두 이 비밀번호를 쓴다.
// Postman 테스트 방법:
//   POST http://localhost:3000/api/v1/auth/login
//   Body(raw, JSON): { "loginId": "testuser01", "password": "test1234!" }
//   (loginId 자리에 reviewuser02, reviewuser03도 동일한 비밀번호로 로그인 가능)
const SEED_USER_PASSWORD = "test1234!";

async function main() {
  // --terms-only: 약관만 넣는다. 배포 환경에는 테스트 유저·리뷰가 들어가면 안 되므로
  // 회원가입에 필요한 약관만 주입할 때 사용한다. (예: pnpm exec tsx src/seed.ts --terms-only)
  if (process.argv.includes("--terms-only")) {
    const auth = await seedAuthTerms();
    const reservation = await seedReservationTerms();
    console.log(
      `약관 시드 완료 — 가입 약관 ${auth.length}건 / 예약 약관 ${reservation.length}건`,
    );
    return;
  }

  const hashedPassword = await bcrypt.hash(SEED_USER_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: {
      loginId: "testuser01",
    },
    update: {
      password: hashedPassword,
      name: "홍길동",
      nickname: "테스트유저",
      email: "test@example.com",
      phoneNumber: "01012345678",
    },
    create: {
      loginId: "testuser01",
      password: hashedPassword,
      name: "홍길동",
      nickname: "테스트유저",
      email: "test@example.com",
      phoneNumber: "01012345678",
    },
  });

  const reviewUser2 = await prisma.user.upsert({
    where: {
      loginId: "reviewuser02",
    },
    update: {
      password: hashedPassword,
      name: "김리뷰",
      nickname: "리뷰어둘",
      email: "reviewer2@example.com",
      phoneNumber: "01022222222",
    },
    create: {
      loginId: "reviewuser02",
      password: hashedPassword,
      name: "김리뷰",
      nickname: "리뷰어둘",
      email: "reviewer2@example.com",
      phoneNumber: "01022222222",
    },
  });

  const reviewUser3 = await prisma.user.upsert({
    where: {
      loginId: "reviewuser03",
    },
    update: {
      password: hashedPassword,
      name: "이리뷰",
      nickname: "리뷰어셋",
      email: "reviewer3@example.com",
      phoneNumber: "01033333333",
    },
    create: {
      loginId: "reviewuser03",
      password: hashedPassword,
      name: "이리뷰",
      nickname: "리뷰어셋",
      email: "reviewer3@example.com",
      phoneNumber: "01033333333",
    },
  });

  const studioA = await upsertStudio("PICDAY HTTP 검증 A");
  const studioB = await upsertStudio("PICDAY HTTP 검증 B");
  const studioC = await upsertStudio("PICDAY HTTP 검증 C");

  await prisma.studio.update({
    where: { id: studioA.id },
    data: {
      introduction:
        "홍대 감성의 자연광 프로필 및 개인 화보 전문 스튜디오입니다.",
      notice:
        "예약 변경은 촬영 3일 전까지 가능합니다.\n촬영 시간에 늦으실 경우 촬영 시간이 단축될 수 있습니다.",
    },
  });

  await prisma.studio.update({
    where: { id: studioC.id },
    data: {
      introduction: null,
      notice: null,
    },
  });

  await prisma.studioLocation.upsert({
    where: { studioId: studioA.id },
    update: {
      locationCategory: "HONGDAE",
      mainAddress: "서울 마포구",
      subAddress: "와우산로 179",
      latitude: 37.5563,
      longitude: 126.9236,
      nearestStation: "홍대입구역",
      walkingMinutes: 5,
      stationDetail: [2, 11, 12],
    },
    create: {
      studioId: studioA.id,
      locationCategory: "HONGDAE",
      mainAddress: "서울 마포구",
      subAddress: "와우산로 179",
      latitude: 37.5563,
      longitude: 126.9236,
      nearestStation: "홍대입구역",
      walkingMinutes: 5,
      stationDetail: [2, 11, 12],
    },
  });

  await prisma.studioLocation.upsert({
    where: { studioId: studioC.id },
    update: {
      locationCategory: "SEONGSU",
      mainAddress: "서울 성동구",
      subAddress: "연무장길 1",
      latitude: 37.5446,
      longitude: 127.0557,
      nearestStation: "성수역",
      walkingMinutes: 7,
      stationDetail: [2],
    },
    create: {
      studioId: studioC.id,
      locationCategory: "SEONGSU",
      mainAddress: "서울 성동구",
      subAddress: "연무장길 1",
      latitude: 37.5446,
      longitude: 127.0557,
      nearestStation: "성수역",
      walkingMinutes: 7,
      stationDetail: [2],
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

  await prisma.productImage.update({
    where: {
      studioProductId_order: {
        studioProductId: profileBasic.id,
        order: 1,
      },
    },
    data: {
      studioThumbnailOrder: 1,
    },
  });

  await prisma.productImage.update({
    where: {
      studioProductId_order: {
        studioProductId: personalPortrait.id,
        order: 1,
      },
    },
    data: {
      studioThumbnailOrder: 2,
    },
  });

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

  for (const serviceCode of ["WIFI", "PARKING", "COSTUME"] as const) {
    await prisma.studioService.upsert({
      where: {
        studioId_serviceCode: {
          studioId: studioA.id,
          serviceCode,
        },
      },
      update: {},
      create: {
        studioId: studioA.id,
        serviceCode,
      },
    });
  }

  const hairMakeupService = await prisma.studioService.upsert({
    where: {
      studioId_serviceCode: {
        studioId: studioA.id,
        serviceCode: "HAIR_MAKEUP",
      },
    },
    update: {},
    create: {
      studioId: studioA.id,
      serviceCode: "HAIR_MAKEUP",
    },
  });

  await upsertHairMakeupDetail(hairMakeupService.id, {
    partnerName: "메이크업 바이 봄",
    additionalPrice: 50000,
    displayOrder: 1,
  });

  await upsertHairMakeupDetail(hairMakeupService.id, {
    partnerName: "홍대 뷰티살롱",
    additionalPrice: 70000,
    displayOrder: 2,
  });

  await upsertHairMakeupDetail(hairMakeupService.id, {
    partnerName: "연남 헤어메이크업",
    additionalPrice: 90000,
    displayOrder: 3,
  });

  const operationSection = await upsertInfoSection("운영 정보");
  const parkingSection = await upsertInfoSection("주차 정보");
  const shootingGuideSection = await upsertInfoSection("촬영 안내");
  const refundGuideSection = await upsertInfoSection("환불 안내");

  await prisma.studioInfoItem.upsert({
    where: {
      studioId_infoSectionId: {
        studioId: studioA.id,
        infoSectionId: operationSection.id,
      },
    },
    update: {
      content:
        "운영시간: 매일 12:00 - 20:00\n휴무일: 연중무휴\n예약 마감: 촬영 1일 전",
    },
    create: {
      studioId: studioA.id,
      infoSectionId: operationSection.id,
      content:
        "운영시간: 매일 12:00 - 20:00\n휴무일: 연중무휴\n예약 마감: 촬영 1일 전",
    },
  });

  await prisma.studioInfoItem.upsert({
    where: {
      studioId_infoSectionId: {
        studioId: studioA.id,
        infoSectionId: parkingSection.id,
      },
    },
    update: {
      content:
        "건물 내 주차 가능 (2시간 무료)\n만차 시 인근 공영주차장 이용 안내",
    },
    create: {
      studioId: studioA.id,
      infoSectionId: parkingSection.id,
      content:
        "건물 내 주차 가능 (2시간 무료)\n만차 시 인근 공영주차장 이용 안내",
    },
  });

  await prisma.studioInfoItem.upsert({
    where: {
      studioId_infoSectionId: {
        studioId: studioA.id,
        infoSectionId: shootingGuideSection.id,
      },
    },
    update: {
      content:
        "의상 무료 대여\n헤어메이크업 제휴 가능\n보정본은 촬영 후 7일 이내 전달",
    },
    create: {
      studioId: studioA.id,
      infoSectionId: shootingGuideSection.id,
      content:
        "의상 무료 대여\n헤어메이크업 제휴 가능\n보정본은 촬영 후 7일 이내 전달",
    },
  });

  await prisma.studioInfoItem.upsert({
    where: {
      studioId_infoSectionId: {
        studioId: studioA.id,
        infoSectionId: refundGuideSection.id,
      },
    },
    update: {
      content: "환불 정책은 사진관 정책에 따름\n당일 취소 불가",
    },
    create: {
      studioId: studioA.id,
      infoSectionId: refundGuideSection.id,
      content: "환불 정책은 사진관 정책에 따름\n당일 취소 불가",
    },
  });

  await prisma.wishlist.upsert({
    where: {
      userId_studioId: {
        userId: user.id,
        studioId: studioA.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      studioId: studioA.id,
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

  const reviewReservation2 = await upsertReservation({
    userId: reviewUser2.id,
    timeSlotId: reservationFutureSlot.id,
    studioProductId: profileBasic.id,
    reserveeName: "김리뷰",
    reserveePhone: "01022222222",
    totalPrice: profileBasic.price,
    status: "COMPLETED",
  });

  const reviewReservation3 = await upsertReservation({
    userId: reviewUser3.id,
    timeSlotId: reservationFutureSlot.id,
    studioProductId: personalPortrait.id,
    reserveeName: "이리뷰",
    reserveePhone: "01033333333",
    totalPrice: personalPortrait.price,
    status: "COMPLETED",
  });

  const previewReview = await prisma.review.upsert({
    where: { reservationId: completedReservation.id },
    update: {
      userId: user.id,
      studioId: studioA.id,
      rating: 5,
      content:
        "사진관 분위기가 좋고 작가님이 친절해서 만족스러운 촬영이었습니다.",
      createdAt: new Date("2026-07-01T05:20:00.000Z"),
    },
    create: {
      reservationId: completedReservation.id,
      userId: user.id,
      studioId: studioA.id,
      rating: 5,
      content:
        "사진관 분위기가 좋고 작가님이 친절해서 만족스러운 촬영이었습니다.",
      createdAt: new Date("2026-07-01T05:20:00.000Z"),
    },
  });

  const secondReview = await prisma.review.upsert({
    where: { reservationId: reviewReservation2.id },
    update: {
      userId: reviewUser2.id,
      studioId: studioA.id,
      rating: 5,
      content: "자연광이 예쁘고 촬영 안내가 자세해서 편안했습니다.",
      createdAt: new Date("2026-07-02T06:00:00.000Z"),
    },
    create: {
      reservationId: reviewReservation2.id,
      userId: reviewUser2.id,
      studioId: studioA.id,
      rating: 5,
      content: "자연광이 예쁘고 촬영 안내가 자세해서 편안했습니다.",
      createdAt: new Date("2026-07-02T06:00:00.000Z"),
    },
  });

  const thirdReview = await prisma.review.upsert({
    where: { reservationId: reviewReservation3.id },
    update: {
      userId: reviewUser3.id,
      studioId: studioA.id,
      rating: 4,
      content: "의상과 컨셉 선택지가 다양해서 다음에도 방문하고 싶습니다.",
      createdAt: new Date("2026-07-03T07:30:00.000Z"),
    },
    create: {
      reservationId: reviewReservation3.id,
      userId: reviewUser3.id,
      studioId: studioA.id,
      rating: 4,
      content: "의상과 컨셉 선택지가 다양해서 다음에도 방문하고 싶습니다.",
      createdAt: new Date("2026-07-03T07:30:00.000Z"),
    },
  });

  await upsertReviewImage(
    previewReview.id,
    "https://example.com/reviews/preview-1.jpg",
  );
  await upsertReviewImage(
    previewReview.id,
    "https://example.com/reviews/preview-2.jpg",
  );
  await upsertReviewImage(
    thirdReview.id,
    "https://example.com/reviews/third-1.jpg",
  );

  for (const reviewLike of [
    { reviewId: previewReview.id, userId: reviewUser2.id },
    { reviewId: previewReview.id, userId: reviewUser3.id },
    { reviewId: secondReview.id, userId: user.id },
  ]) {
    await prisma.reviewLike.upsert({
      where: {
        reviewId_userId: reviewLike,
      },
      update: {},
      create: reviewLike,
    });
  }

  // 최근 본 사진관 (홈 화면 API의 recentStudios 테스트용)
  // studioA가 더 최근에 봤으므로 recentStudios 조회 시 studioA가 studioB보다 먼저 나와야 함
  for (const recentView of [
    {
      userId: user.id,
      studioId: studioB.id,
      viewedAt: new Date("2030-12-20T10:00:00.000Z"),
    },
    {
      userId: user.id,
      studioId: studioA.id,
      viewedAt: new Date("2030-12-21T10:00:00.000Z"),
    },
  ]) {
    await prisma.recentStudioView.upsert({
      where: {
        userId_studioId: {
          userId: recentView.userId,
          studioId: recentView.studioId,
        },
      },
      update: { viewedAt: recentView.viewedAt },
      create: recentView,
    });
  }

  const seededTerms = await seedAuthTerms();
  const seededReservationTerms = await seedReservationTerms();

  console.log("✅ 시드 완료");

  console.log("\n--- 회원가입 약관(SIGNUP) 테스트용 ---");
  for (const term of seededTerms) {
    console.log(`${term.type.padEnd(20)} ID:`, term.id.toString());
  }

  console.log("\n--- 예약 약관(RESERVATION) 테스트용 ---");
  for (const term of seededReservationTerms) {
    console.log(`${term.type.padEnd(20)} ID:`, term.id.toString());
  }

  console.log("\n--- 사진관 및 컨셉 API 테스트용 ---");
  console.log("사진관 A ID                 :", studioA.id.toString());
  console.log("사진관 B ID                 :", studioB.id.toString());
  console.log("사진관 C ID                 :", studioC.id.toString());
  console.log("기본 프로필 상품 ID         :", profileBasic.id.toString());
  console.log("개인 화보 상품 ID           :", personalPortrait.id.toString());
  console.log("이미지 없는 상품 ID         :", premiumProfile.id.toString());
  console.log("다른 사진관 소속 상품 ID   :", otherStudioProduct.id.toString());

  console.log("\n--- 사진관 상세 정보 API 테스트용 ---");
  console.log("상세 데이터 사진관 ID       :", studioA.id.toString());
  console.log("빈 데이터 사진관 ID         :", studioC.id.toString());
  console.log("대표 리뷰 ID                :", previewReview.id.toString());
  console.log("예상 평균 평점              : 4.7");
  console.log("예상 헤어메이크업 제휴 수  : 3");

  console.log("\n--- 예약 가능 시간 API 테스트용 ---");
  console.log("테스트 날짜                 : 2030-12-25");
  console.log("미래 가용 슬롯 ID           :", availableSlot.id.toString());
  console.log("미래 마감 슬롯 ID           :", unavailableSlot.id.toString());
  console.log("다른 사진관 슬롯 ID         :", otherStudioSlot.id.toString());

  console.log("\n--- 홈 화면(getHome) API 테스트용 ---");
  console.log(
    "testuser01의 최근 본 사진관(최신순): studioA(",
    studioA.id.toString(),
    "), studioB(",
    studioB.id.toString(),
    ")",
  );

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