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
    data: { name: "PICDAY 홍대점", description: "홍대 인근 사진관" },
  });

  const product = await prisma.studioProduct.create({
    data: {
      studioId: studio.id,
      shootingCategory: "PROFILE",
      name: "프로필 촬영 패키지",
      price: 50000,
    },
  });

  // 미래 타임슬롯 (정상 취소 테스트용)
  const futureSlot = await prisma.timeSlot.create({
    data: {
      studioId: studio.id,
      date: new Date("2026-12-25"),
      startTime: new Date("1970-01-01T10:00:00Z"),
      endTime: new Date("1970-01-01T11:00:00Z"),
    },
  });

  // 오늘 날짜 타임슬롯 (당일취소 테스트용)
const now = new Date();
const todayDateOnly = new Date(Date.UTC(
now.getFullYear(),
now.getMonth(),
now.getDate(),
12, 0, 0
));
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
    studioProductId: product.id,
    reserveeName: "홍길동",
    phoneNumber: "01012345678",
    totalPrice: 50000,
  };

  // 1. 정상 취소 가능 (RESERVED, 미래 날짜)
  const normal = await prisma.reservation.create({
    data: { ...base, timeSlotId: futureSlot.id, status: "RESERVED" },
  });

  // 2. 이미 취소됨 (4092 테스트용)
  const cancelled = await prisma.reservation.create({
    data: {
      ...base,
      timeSlotId: futureSlot.id,
      status: "CANCELLED",
      canceledAt: new Date(),
    },
  });

  // 3. 이미 완료됨 (4093 테스트용)
  const completed = await prisma.reservation.create({
    data: { ...base, timeSlotId: futureSlot.id, status: "COMPLETED" },
  });

  // 4. 당일 취소 시도 대상 (4002 테스트용)
  const sameDay = await prisma.reservation.create({
    data: { ...base, timeSlotId: todaySlot.id, status: "RESERVED" },
  });

  console.log("✅ 시드 완료");
  console.log("정상 취소용 id     :", normal.id.toString());
  console.log("이미 취소됨 id     :", cancelled.id.toString());
  console.log("이미 완료됨 id     :", completed.id.toString());
  console.log("당일취소 대상 id   :", sameDay.id.toString());
  console.log("존재하지 않는 id   : 999999 (실제로 없는 값)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });