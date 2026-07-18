// src/scripts/seed.ts
import "dotenv/config";
import { prisma } from "./config/prisma.js";

async function main() {
  const user = await prisma.user.create({
    data: {
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
  });

  // 오늘 날짜 타임슬롯 (당일취소 테스트용)
  const now = new Date();
  const todayDateOnly = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0),
  );
  const todaySlot = await prisma.timeSlot.create({
    data: {
      studioId: studio.id,
      date: todayDateOnly,
      startTime: new Date("1970-01-01T15:00:00Z"),
      endTime: new Date("1970-01-01T16:00:00Z"),
    },
  });

  const base = {
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });