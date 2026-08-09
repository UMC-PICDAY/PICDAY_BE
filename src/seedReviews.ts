// src/seedReviews.ts
// 리뷰 목업 데이터 시드 (리뷰 443 / 작성자 443 / 좋아요 약 3,700)
//
//   실행:        pnpm seed:reviews
//   재실행(초기화): pnpm seed:reviews --reset
//
// 사진관 시드(pnpm seed:studios)가 먼저 들어가 있어야 한다.
//
// 리뷰는 예약에 종속(reservation_id 필수·UNIQUE)되므로 작성자·과거 예약도 함께 만든다.
// 기존 예약 슬롯(오늘~30일치)은 건드리지 않고, 리뷰 작성일 기준의 과거 슬롯을 새로 만든다.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "./config/prisma.js";
import type { ReviewKeyword } from "./generated/prisma/client.js";

// 시드로 만든 작성자를 구분하는 접두어 (--reset 시 이 계정들만 삭제)
const SEED_LOGIN_PREFIX = "sdrv";

type SeedReview = {
  reviewExcelId: string;
  studioExcelId: string;
  nickname: string;
  rating: number;
  productPrefix: string;
  writtenAt: string;
  content: string;
  keywords: ReviewKeyword[];
  imageUrls: string[];
  likeCount: number;
};

type SeedStudio = { excelId: string; name: string };

const DATA_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "prisma",
  "seed-data",
);

function load<T>(file: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, file), "utf-8")) as T;
}

function toDate(yyyymmdd: string): Date {
  const [year, month, day] = yyyymmdd.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}

function toTime(totalMinutes: number): Date {
  return new Date(
    Date.UTC(1970, 0, 1, Math.floor(totalMinutes / 60), totalMinutes % 60),
  );
}

// --reset: 시드로 만든 리뷰·예약·작성자만 삭제한다.
// 실제 사용자가 만든 데이터는 loginId 접두어로 구분되어 남는다.
async function resetReviewSeed() {
  console.log("기존 리뷰 시드를 삭제합니다...");

  const users = await prisma.user.findMany({
    where: { loginId: { startsWith: SEED_LOGIN_PREFIX } },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  if (userIds.length === 0) {
    console.log("삭제할 시드 데이터가 없습니다.");
    return;
  }

  const reviews = await prisma.review.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const reviewIds = reviews.map((review) => review.id);

  const reservations = await prisma.reservation.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, timeSlotId: true },
  });

  await prisma.reviewImage.deleteMany({ where: { reviewId: { in: reviewIds } } });
  await prisma.reviewKeywordTag.deleteMany({ where: { reviewId: { in: reviewIds } } });
  await prisma.reviewLike.deleteMany({ where: { reviewId: { in: reviewIds } } });
  await prisma.reviewLike.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.review.deleteMany({ where: { id: { in: reviewIds } } });
  await prisma.reservation.deleteMany({
    where: { id: { in: reservations.map((r) => r.id) } },
  });
  await prisma.timeSlot.deleteMany({
    where: { id: { in: reservations.map((r) => r.timeSlotId) } },
  });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  console.log(`삭제 완료 (작성자 ${userIds.length}명, 리뷰 ${reviewIds.length}건)`);
}

async function main() {
  if (process.argv.includes("--reset")) {
    await resetReviewSeed();
  }

  const seedReviews = load<SeedReview[]>("reviews.json");
  const seedStudios = load<SeedStudio[]>("studios.json");

  const existing = await prisma.review.count();
  if (existing > 0) {
    console.error(
      `이미 리뷰 ${existing}건이 존재합니다. 다시 넣으려면 --reset 옵션을 사용하세요.`,
    );
    return;
  }

  // ===== 사진관·상품 조회 (엑셀 ID → DB ID) =====
  const studioNameByExcelId = new Map(
    seedStudios.map((studio) => [studio.excelId, studio.name]),
  );
  const studios = await prisma.studio.findMany({
    select: {
      id: true,
      name: true,
      products: { select: { id: true, name: true, price: true } },
    },
  });

  if (studios.length === 0) {
    console.error("사진관 데이터가 없습니다. 먼저 pnpm seed:studios 를 실행하세요.");
    return;
  }

  const studioByName = new Map(studios.map((studio) => [studio.name, studio]));

  // ===== 작성자 생성 =====
  console.log(`작성자 ${seedReviews.length}명 생성 중...`);
  await prisma.user.createMany({
    data: seedReviews.map((review, index) => ({
      loginId: `${SEED_LOGIN_PREFIX}${String(index + 1).padStart(4, "0")}`,
      nickname: review.nickname,
      email: `${SEED_LOGIN_PREFIX}${String(index + 1).padStart(4, "0")}@picday.seed`,
      phoneNumber: `010${String(10000000 + index).slice(0, 8)}`,
      provider: "LOCAL" as const,
      status: "ACTIVE" as const,
    })),
    skipDuplicates: true,
  });

  const users = await prisma.user.findMany({
    where: { loginId: { startsWith: SEED_LOGIN_PREFIX } },
    select: { id: true, nickname: true },
  });
  const userIdByNickname = new Map(
    users.map((user) => [user.nickname ?? "", user.id]),
  );
  const userIdPool = users.map((user) => user.id);

  // ===== 리뷰 + 예약 + 과거 슬롯 생성 =====
  // 같은 사진관·같은 날짜에 여러 리뷰가 있으면 슬롯 시간을 30분씩 밀어 중복을 피한다.
  const slotCursor = new Map<string, number>();
  const likeRows: { reviewId: bigint; userId: bigint }[] = [];
  const skipped: string[] = [];
  let created = 0;

  for (const seed of seedReviews) {
    const studioName = studioNameByExcelId.get(seed.studioExcelId);
    const studio = studioName ? studioByName.get(studioName) : undefined;
    const userId = userIdByNickname.get(seed.nickname);

    const product = studio?.products.find((item) =>
      item.name.startsWith(seed.productPrefix),
    );

    if (!studio || !product || !userId) {
      skipped.push(seed.reviewExcelId);
      continue;
    }

    const slotKey = `${studio.id}-${seed.writtenAt}`;
    const order = slotCursor.get(slotKey) ?? 0;
    slotCursor.set(slotKey, order + 1);
    const startMinutes = 9 * 60 + order * 30;

    const writtenAt = toDate(seed.writtenAt);

    // Prisma는 한 create 안에서 스칼라 FK와 관계를 섞을 수 없어 connect로 통일한다.
    const reservation = await prisma.reservation.create({
      data: {
        user: { connect: { id: userId } },
        studioProduct: { connect: { id: product.id } },
        reserveeName: seed.nickname.slice(0, 50),
        reserveePhone: "01000000000",
        totalPrice: product.price,
        status: "COMPLETED",
        createdAt: writtenAt,
        timeSlot: {
          create: {
            studio: { connect: { id: studio.id } },
            date: writtenAt,
            startTime: toTime(startMinutes),
            endTime: toTime(startMinutes + 30),
            isAvailable: false,
          },
        },
        review: {
          create: {
            user: { connect: { id: userId } },
            studio: { connect: { id: studio.id } },
            rating: seed.rating,
            content: seed.content.slice(0, 500),
            createdAt: writtenAt,
            images: { create: seed.imageUrls.map((url) => ({ url })) },
            keywords: { create: seed.keywords.map((keyword) => ({ keyword })) },
          },
        },
      },
      select: { review: { select: { id: true } } },
    });

    const reviewId = reservation.review!.id;
    created += 1;

    // 좋아요: 작성자 본인을 제외한 유저 풀에서 순서대로 배정 (UNIQUE 충돌 방지)
    const likeTargets = Math.min(seed.likeCount, userIdPool.length - 1);
    let assigned = 0;
    let cursor = created * 7; // 리뷰마다 시작 위치를 달리해 특정 유저에 쏠리지 않게
    while (assigned < likeTargets) {
      const candidate = userIdPool[cursor % userIdPool.length]!;
      cursor += 1;
      if (candidate === userId) {
        continue;
      }
      likeRows.push({ reviewId, userId: candidate });
      assigned += 1;
    }

    if (created % 100 === 0) {
      console.log(`  ${created}/${seedReviews.length}`);
    }
  }

  // ===== 좋아요 일괄 삽입 =====
  console.log(`좋아요 ${likeRows.length}건 생성 중...`);
  const CHUNK = 2000;
  for (let i = 0; i < likeRows.length; i += CHUNK) {
    await prisma.reviewLike.createMany({ data: likeRows.slice(i, i + CHUNK) });
  }

  // ===== 사진관 평균 평점 재계산 =====
  // 카드에 보이는 평점과 리뷰 탭의 평균이 어긋나지 않도록 리뷰 기준으로 맞춘다.
  console.log("사진관 평균 평점 재계산 중...");
  const grouped = await prisma.review.groupBy({
    by: ["studioId"],
    _avg: { rating: true },
  });
  for (const row of grouped) {
    if (row._avg.rating === null) {
      continue;
    }
    await prisma.studio.update({
      where: { id: row.studioId },
      data: { ratingScore: Math.round(row._avg.rating * 10) / 10 },
    });
  }

  console.log("\n시드 완료");
  console.log(`  작성자     : ${users.length}`);
  console.log(`  리뷰       : ${created}`);
  console.log(`  리뷰 이미지 : ${seedReviews.reduce((sum, r) => sum + r.imageUrls.length, 0)}`);
  console.log(`  리뷰 태그   : ${seedReviews.reduce((sum, r) => sum + r.keywords.length, 0)}`);
  console.log(`  좋아요     : ${likeRows.length}`);
  console.log(`  평점 갱신   : ${grouped.length}개 사진관`);
  if (skipped.length > 0) {
    console.log(`  ⚠️ 건너뜀   : ${skipped.length}건 ${skipped.slice(0, 5).join(", ")}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
