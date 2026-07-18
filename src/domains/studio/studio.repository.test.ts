import assert from "node:assert/strict";
import { beforeEach, mock, test } from "node:test";

let studioResult: unknown;
let timeSlotResult: unknown;
let receivedStudioArgs: unknown;
let receivedTimeSlotArgs: unknown;

mock.module("../../config/prisma.js", {
  namedExports: {
    prisma: {
      studio: {
        async findUnique(args: unknown) {
          receivedStudioArgs = args;
          return studioResult;
        },
      },
      timeSlot: {
        async findUnique(args: unknown) {
          receivedTimeSlotArgs = args;
          return timeSlotResult;
        },
      },
    },
  },
});

const { findStudioProducts, findTimeSlotById } =
  await import("./studio.repository.js");

beforeEach(() => {
  studioResult = undefined;
  timeSlotResult = undefined;
  receivedStudioArgs = undefined;
  receivedTimeSlotArgs = undefined;
});

test("finds a studio with its raw product and image rows", async () => {
  studioResult = {
    id: 1n,
    name: "데이지 스튜디오",
    products: [
      {
        id: 10n,
        shootingCategory: "PROFILE",
        name: "프로필 기본",
        price: 55000,
        basePeople: 1,
        shortDescription: null,
        productImages: [
          { url: "https://example.com/first.jpg", order: 1 },
          { url: "https://example.com/second.jpg", order: 2 },
        ],
      },
    ],
  };

  const result = await findStudioProducts(1n);

  assert.equal(result, studioResult);
  assert.deepEqual(result, {
    id: 1n,
    name: "데이지 스튜디오",
    products: [
      {
        id: 10n,
        shootingCategory: "PROFILE",
        name: "프로필 기본",
        price: 55000,
        basePeople: 1,
        shortDescription: null,
        productImages: [
          { url: "https://example.com/first.jpg", order: 1 },
          { url: "https://example.com/second.jpg", order: 2 },
        ],
      },
    ],
  });
});

test("selects only required fields and orders products and images", async () => {
  studioResult = { id: 1n, name: "데이지 스튜디오", products: [] };

  await findStudioProducts(1n);

  assert.deepEqual(receivedStudioArgs, {
    where: { id: 1n },
    select: {
      id: true,
      name: true,
      products: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          shootingCategory: true,
          name: true,
          price: true,
          basePeople: true,
          shortDescription: true,
          productImages: {
            orderBy: { order: "asc" },
            select: {
              url: true,
              order: true,
            },
          },
        },
      },
    },
  });
});

test("returns a studio with an empty products array without grouping", async () => {
  studioResult = { id: 1n, name: "상품 없는 스튜디오", products: [] };

  const result = await findStudioProducts(1n);

  assert.equal(result, studioResult);
  assert.deepEqual(result, {
    id: 1n,
    name: "상품 없는 스튜디오",
    products: [],
  });
  assert.equal("productGroups" in (result ?? {}), false);
});

test("returns null when the studio does not exist", async () => {
  studioResult = null;

  const result = await findStudioProducts(999n);

  assert.equal(result, null);
});

test("finds a raw time slot without recalculating availability", async () => {
  const date = new Date("2026-06-18T00:00:00.000Z");
  const startTime = new Date("1970-01-01T14:00:00.000Z");
  const endTime = new Date("1970-01-01T15:00:00.000Z");
  timeSlotResult = {
    id: 12n,
    studioId: 1n,
    date,
    startTime,
    endTime,
    isAvailable: false,
  };

  const result = await findTimeSlotById(12n);

  assert.equal(result, timeSlotResult);
  assert.deepEqual(result, {
    id: 12n,
    studioId: 1n,
    date,
    startTime,
    endTime,
    isAvailable: false,
  });
  assert.deepEqual(receivedTimeSlotArgs, {
    where: { id: 12n },
    select: {
      id: true,
      studioId: true,
      date: true,
      startTime: true,
      endTime: true,
      isAvailable: true,
    },
  });
});

test("returns null when the time slot does not exist", async () => {
  timeSlotResult = null;

  const result = await findTimeSlotById(999n);

  assert.equal(result, null);
});
