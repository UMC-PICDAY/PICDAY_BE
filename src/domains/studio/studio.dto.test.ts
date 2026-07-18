import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createStudioProductsResponse,
  getStudioSlotsSuccessResponseSchema,
  parseGetStudioProductsRequest,
  parseGetStudioSlotsRequest,
  studioProductsResponseSchema,
  studioSlotResponseSchema,
} from "./studio.dto.js";

test("parses a studio slot request", () => {
  const result = parseGetStudioSlotsRequest({
    studioId: "123",
    date: "2026-07-15",
  });

  assert.equal(result.studioId, 123n);
  assert.equal(result.dateText, "2026-07-15");
  assert.equal(result.dbDate.toISOString(), "2026-07-15T00:00:00.000Z");
});

test("rejects invalid studio ids", () => {
  for (const studioId of ["0", "-1", "1.5", "abc", " 1", "1 ", "1 0", "1e3"]) {
    assert.throws(() =>
      parseGetStudioSlotsRequest({ studioId, date: "2026-07-15" }),
    );
  }
});

test("converts a very large studio id without precision loss", () => {
  const studioId = "123456789012345678901234567890";
  const result = parseGetStudioSlotsRequest({ studioId, date: "2026-07-15" });

  assert.equal(result.studioId, 123456789012345678901234567890n);
});

test("rejects a missing or malformed date", () => {
  for (const date of [undefined, "", "2026-7-15", "2026/07/15"]) {
    assert.throws(() => parseGetStudioSlotsRequest({ studioId: "1", date }));
  }
});

test("rejects dates that do not exist", () => {
  for (const date of ["2026-02-30", "2026-04-31", "2026-13-01"]) {
    assert.throws(() => parseGetStudioSlotsRequest({ studioId: "1", date }));
  }
});

test("validates leap years", () => {
  assert.throws(() =>
    parseGetStudioSlotsRequest({ studioId: "1", date: "2026-02-29" }),
  );

  const result = parseGetStudioSlotsRequest({
    studioId: "1",
    date: "2028-02-29",
  });
  assert.equal(result.dateText, "2028-02-29");
  assert.equal(result.dbDate.toISOString(), "2028-02-29T00:00:00.000Z");
});

test("serializes a Prisma slot id and UTC times", () => {
  const result = studioSlotResponseSchema.parse({
    slotId: 9007199254740993n,
    startTime: new Date("1970-01-01T10:00:00.000Z"),
    endTime: new Date("1970-01-01T09:05:00.000Z"),
    isAvailable: true,
  });

  assert.deepEqual(result, {
    slotId: "9007199254740993",
    startTime: "10:00",
    endTime: "09:05",
    isAvailable: true,
  });
});

test("serializes the common success response", () => {
  const result = getStudioSlotsSuccessResponseSchema.parse({
    success: true,
    code: "COMMON_200",
    message: "예약 가능 시간 조회에 성공했습니다.",
    data: [
      {
        slotId: 1n,
        startTime: new Date("1970-01-01T10:00:00.000Z"),
        endTime: new Date("1970-01-01T11:00:00.000Z"),
        isAvailable: false,
      },
    ],
  });

  assert.deepEqual(result.data[0], {
    slotId: "1",
    startTime: "10:00",
    endTime: "11:00",
    isAvailable: false,
  });
});

test("parses a studio products request without a selected time slot", () => {
  const result = parseGetStudioProductsRequest({ studioId: "123" });
  const explicitUndefinedResult = parseGetStudioProductsRequest({
    studioId: "123",
    timeSlotId: undefined,
  });

  assert.equal(result.studioId, 123n);
  assert.equal(result.timeSlotId, undefined);
  assert.equal(explicitUndefinedResult.timeSlotId, undefined);
});

test("parses a studio products request with a selected time slot", () => {
  const result = parseGetStudioProductsRequest({
    studioId: "123",
    timeSlotId: "456",
  });

  assert.deepEqual(result, {
    studioId: 123n,
    timeSlotId: 456n,
  });
});

test("rejects invalid studio ids for a studio products request", () => {
  for (const studioId of ["0", "-1", "1.5", " ", "abc"]) {
    assert.throws(() => parseGetStudioProductsRequest({ studioId }));
  }
});

test("rejects invalid time slot ids for a studio products request", () => {
  for (const timeSlotId of ["0", "-1", "1.5", "", "abc"]) {
    assert.throws(() =>
      parseGetStudioProductsRequest({ studioId: "1", timeSlotId }),
    );
  }
});

test("converts very large studio product request ids without precision loss", () => {
  const largeId = "123456789012345678901234567890";
  const result = parseGetStudioProductsRequest({
    studioId: largeId,
    timeSlotId: largeId,
  });

  assert.equal(result.studioId, 123456789012345678901234567890n);
  assert.equal(result.timeSlotId, 123456789012345678901234567890n);
});

test("validates a studio products response with no selected slot or products", () => {
  const result = createStudioProductsResponse({
    studioId: 1n,
    studioName: "데이지 스튜디오",
    selectedSlot: null,
    productGroups: [],
  });

  assert.deepEqual(result, {
    studioId: "1",
    studioName: "데이지 스튜디오",
    selectedSlot: null,
    productGroups: [],
  });
});

test("serializes a selected slot and a product with multiple images", () => {
  const result = createStudioProductsResponse({
    studioId: 1n,
    studioName: "데이지 스튜디오",
    selectedSlot: {
      timeSlotId: 9007199254740993n,
      date: new Date("2026-06-18T00:00:00.000Z"),
      startTime: new Date("1970-01-01T14:00:00.000Z"),
      endTime: new Date("1970-01-01T15:00:00.000Z"),
      isAvailable: true,
    },
    productGroups: [
      {
        shootingCategory: "PROFILE",
        products: [
          {
            studioProductId: 9007199254740995n,
            productName: "프로필 기본",
            imageUrls: [
              "https://example.com/image1.jpg",
              "https://example.com/image2.jpg",
            ],
            price: 55000,
            basePeople: 1,
            shortDescription: null,
          },
        ],
      },
    ],
  });

  assert.equal(result.selectedSlot?.timeSlotId, "9007199254740993");
  assert.equal(result.selectedSlot?.date, "2026-06-18");
  assert.equal(result.selectedSlot?.startTime, "14:00");
  assert.equal(result.selectedSlot?.endTime, "15:00");
  assert.equal(
    result.productGroups[0]?.products[0]?.studioProductId,
    "9007199254740995",
  );
  assert.equal(result.productGroups[0]?.products[0]?.imageCount, 2);
  assert.equal(result.productGroups[0]?.products[0]?.shortDescription, null);
});

test("rejects a product whose base people count is zero", () => {
  assert.throws(() =>
    createStudioProductsResponse({
      studioId: 1n,
      studioName: "데이지 스튜디오",
      selectedSlot: null,
      productGroups: [
        {
          shootingCategory: "PROFILE",
          products: [
            {
              studioProductId: 1n,
              productName: "프로필 기본",
              imageUrls: [],
              price: 55000,
              basePeople: 0,
              shortDescription: "기본 프로필",
            },
          ],
        },
      ],
    }),
  );
});

test("calculates imageCount from imageUrls instead of trusting input", () => {
  const result = studioProductsResponseSchema.parse({
    studioId: 1n,
    studioName: "데이지 스튜디오",
    selectedSlot: null,
    productGroups: [
      {
        shootingCategory: "PROFILE",
        products: [
          {
            studioProductId: 1n,
            productName: "프로필 기본",
            imageUrls: [
              "https://example.com/image1.jpg",
              "https://example.com/image2.jpg",
            ],
            imageCount: 999,
            price: 55000,
            basePeople: 1,
            shortDescription: "기본 프로필",
          },
        ],
      },
    ],
  });

  assert.equal(result.productGroups[0]?.products[0]?.imageCount, 2);
});
