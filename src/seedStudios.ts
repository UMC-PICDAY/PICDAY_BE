// src/seedStudios.ts
// 사진관 목업 데이터 시드 (사진관 50 / 상품 164 / 이미지 190)
//
//   실행:        pnpm seed:studios
//   재실행(초기화): pnpm seed:studios --reset
//
// 원본은 prisma/seed-data/studios.json (목업 엑셀 v7에서 생성).
// 엑셀이 갱신되면 prisma/seed-data/generate-from-xlsx.py 를 다시 돌려 JSON을 교체한다.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "./config/prisma.js";
import type {
  LocationCategory,
  ServiceCode,
  ShootingCategory,
} from "./generated/prisma/client.js";

// 예약 가능 시간을 오늘부터 며칠치 생성할지
const SLOT_DAYS = 30;

// 사진관 상세 API가 인식하는 정보 섹션 제목 (studio.detail.service.ts와 일치해야 함)
const INFO_SECTION_TITLES = [
  "운영 정보",
  "주차 정보",
  "촬영 안내",
  "환불 안내",
] as const;

type SeedStudio = {
  excelId: string;
  name: string;
  introduction: string;
  notice: string;
  ratingScore: number;
  reservationCount: number;
  location: {
    mainAddress: string;
    subAddress: string;
    locationCategory: LocationCategory;
    latitude: string;
    longitude: string;
    nearestStation: string;
    walkingMinutes: number;
    stationDetail: number[];
  };
  products: {
    name: string;
    price: number;
    shootingCategory: ShootingCategory;
    basePeople: number;
    hasAdditionalPrice: boolean;
    images: {
      url: string;
      order: number;
      studioThumbnailOrder: number | null;
    }[];
  }[];
  services: ServiceCode[];
  hairMakeupDetails: {
    partnerName: string;
    additionalPrice: number;
    displayOrder: number;
  }[];
  schedule: {
    hours: { weekday: [string, string]; weekend: [string, string] };
    slotMinutes: number;
    // 정기 휴무 요일 (0=일 ~ 6=토). 없으면 null
    closedWeekday: number | null;
  };
  info: Record<string, string>;
};

const SEED_FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "prisma",
  "seed-data",
  "studios.json",
);

function loadStudios(): SeedStudio[] {
  return JSON.parse(readFileSync(SEED_FILE, "utf-8")) as SeedStudio[];
}

// "14:30" → Time 컬럼용 Date (날짜 부분은 무시됨)
function toTime(hhmm: string): Date {
  const [hour, minute] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0));
}

function minutesOf(hhmm: string): number {
  const [hour, minute] = hhmm.split(":").map(Number);
  return hour! * 60 + minute!;
}

function toHhmm(totalMinutes: number): string {
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minute = String(totalMinutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
}

type SlotRow = {
  studioId: bigint;
  date: Date;
  startTime: Date;
  endTime: Date;
};

// 오늘부터 SLOT_DAYS일치 예약 슬롯 생성 (휴무 요일 제외)
function buildTimeSlots(studioId: bigint, schedule: SeedStudio["schedule"]) {
  const slots: SlotRow[] = [];
  const today = new Date();

  for (let offset = 0; offset < SLOT_DAYS; offset += 1) {
    const day = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + offset),
    );
    const weekday = day.getUTCDay();

    if (schedule.closedWeekday === weekday) {
      continue;
    }

    const isWeekend = weekday === 0 || weekday === 6;
    const [open, close] = isWeekend
      ? schedule.hours.weekend
      : schedule.hours.weekday;

    const closeMinutes = minutesOf(close);
    for (
      let start = minutesOf(open);
      start + schedule.slotMinutes <= closeMinutes;
      start += schedule.slotMinutes
    ) {
      slots.push({
        studioId,
        date: day,
        startTime: toTime(toHhmm(start)),
        endTime: toTime(toHhmm(start + schedule.slotMinutes)),
      });
    }
  }

  return slots;
}

// 정보 섹션은 전 사진관 공통이므로 먼저 만들어 두고 id를 재사용한다.
async function ensureInfoSections(): Promise<Map<string, bigint>> {
  const sectionIdByTitle = new Map<string, bigint>();

  for (const title of INFO_SECTION_TITLES) {
    const existing = await prisma.infoSection.findFirst({
      where: { title },
      select: { id: true },
    });
    const section =
      existing ??
      (await prisma.infoSection.create({
        data: { title },
        select: { id: true },
      }));
    sectionIdByTitle.set(title, section.id);
  }

  return sectionIdByTitle;
}

// --reset: 사진관 관련 데이터만 삭제한다. 유저·약관은 건드리지 않는다.
// 예약이나 리뷰가 이미 있으면 FK 제약으로 실패하는데, 이는 의도된 안전장치다.
async function resetStudioData() {
  console.log("기존 사진관 데이터를 삭제합니다...");
  await prisma.productImage.deleteMany();
  await prisma.studioHairMakeupDetail.deleteMany();
  await prisma.studioService.deleteMany();
  await prisma.studioInfoItem.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.recentStudioView.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.studioProduct.deleteMany();
  await prisma.studioLocation.deleteMany();
  await prisma.studio.deleteMany();
  console.log("삭제 완료");
}

async function main() {
  const shouldReset = process.argv.includes("--reset");
  const studios = loadStudios();

  if (shouldReset) {
    await resetStudioData();
  }

  const existingCount = await prisma.studio.count();
  if (existingCount > 0) {
    console.error(
      `이미 사진관 ${existingCount}개가 존재합니다. 다시 넣으려면 --reset 옵션을 사용하세요.`,
    );
    return;
  }

  const sectionIdByTitle = await ensureInfoSections();

  let productCount = 0;
  let imageCount = 0;
  const slotRows: SlotRow[] = [];

  for (const seed of studios) {
    const studio = await prisma.studio.create({
      data: {
        name: seed.name,
        introduction: seed.introduction,
        notice: seed.notice,
        ratingScore: seed.ratingScore,
        reservationCount: seed.reservationCount,
        location: { create: seed.location },
        studioInfoItems: {
          create: Object.entries(seed.info)
            .filter(([, content]) => content.trim().length > 0)
            .map(([title, content]) => ({
              infoSectionId: sectionIdByTitle.get(title)!,
              content,
            })),
        },
      },
      select: { id: true },
    });

    for (const product of seed.products) {
      await prisma.studioProduct.create({
        data: {
          studioId: studio.id,
          name: product.name,
          price: product.price,
          shootingCategory: product.shootingCategory,
          basePeople: product.basePeople,
          hasAdditionalPrice: product.hasAdditionalPrice,
          productImages: { create: product.images },
        },
        select: { id: true },
      });
      productCount += 1;
      imageCount += product.images.length;
    }

    for (const serviceCode of seed.services) {
      const service = await prisma.studioService.create({
        data: { studioId: studio.id, serviceCode },
        select: { id: true },
      });

      if (serviceCode === "HAIR_MAKEUP") {
        await prisma.studioHairMakeupDetail.createMany({
          data: seed.hairMakeupDetails.map((detail) => ({
            studioServiceId: service.id,
            ...detail,
          })),
        });
      }
    }

    slotRows.push(...buildTimeSlots(studio.id, seed.schedule));
  }

  // 슬롯은 수가 많아 나눠서 넣는다.
  const CHUNK = 2000;
  for (let i = 0; i < slotRows.length; i += CHUNK) {
    await prisma.timeSlot.createMany({ data: slotRows.slice(i, i + CHUNK) });
  }

  console.log("시드 완료");
  console.log(`  사진관     : ${studios.length}`);
  console.log(`  상품       : ${productCount}`);
  console.log(`  상품 이미지 : ${imageCount}`);
  console.log(`  예약 슬롯   : ${slotRows.length} (오늘부터 ${SLOT_DAYS}일치)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
