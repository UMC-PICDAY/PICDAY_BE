import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { AppError } from "../../common/error.js";
import type {
  FindStudioProductsResult,
  FindStudioWithTimeSlotsByDateResult,
  FindTimeSlotByIdResult,
} from "./studio.repository.js";

const FIXED_NOW = new Date("2026-07-14T15:30:15.000Z"); // 00:30:15 KST on July 15
const nowProvider = () => FIXED_NOW;

let repositoryResult: FindStudioWithTimeSlotsByDateResult = {
  id: 1n,
  timeSlots: [],
};
let repositoryError: unknown;
let repositoryCallCount = 0;
let receivedStudioId: bigint | undefined;
let receivedDate: Date | undefined;

const FIXED_NOW_MILLISECONDS = FIXED_NOW.getTime();
const timestampNowProvider = () => FIXED_NOW_MILLISECONDS;

let studioProductsResult: FindStudioProductsResult = {
  id: 1n,
  name: "데이지 스튜디오",
  products: [],
};
let timeSlotResult: FindTimeSlotByIdResult = null;
let studioProductsError: unknown;
let timeSlotError: unknown;
let studioProductsCallCount = 0;
let timeSlotCallCount = 0;
let receivedProductsStudioId: bigint | undefined;
let receivedTimeSlotId: bigint | undefined;

function time(value: string) {
  return new Date(`1970-01-01T${value}Z`);
}

function resetRepositoryMock() {
  repositoryResult = { id: 1n, timeSlots: [] };
  repositoryError = undefined;
  repositoryCallCount = 0;
  receivedStudioId = undefined;
  receivedDate = undefined;
  studioProductsResult = {
    id: 1n,
    name: "데이지 스튜디오",
    products: [],
  };
  timeSlotResult = null;
  studioProductsError = undefined;
  timeSlotError = undefined;
  studioProductsCallCount = 0;
  timeSlotCallCount = 0;
  receivedProductsStudioId = undefined;
  receivedTimeSlotId = undefined;
}

mock.module("./studio.repository.js", {
  namedExports: {
    async findStudioWithTimeSlotsByDate(studioId: bigint, date: Date) {
      repositoryCallCount += 1;
      receivedStudioId = studioId;
      receivedDate = date;

      if (repositoryError) {
        throw repositoryError;
      }
      return repositoryResult;
    },
    async findStudioProducts(studioId: bigint) {
      studioProductsCallCount += 1;
      receivedProductsStudioId = studioId;

      if (studioProductsError) {
        throw studioProductsError;
      }
      return studioProductsResult;
    },
    async findTimeSlotById(timeSlotId: bigint) {
      timeSlotCallCount += 1;
      receivedTimeSlotId = timeSlotId;

      if (timeSlotError) {
        throw timeSlotError;
      }
      return timeSlotResult;
    },
  },
});

const { getStudioProducts, getStudioSlots } =
  await import("./studio.service.js");

async function assertAppError(
  studioId: string,
  date: string | undefined,
  expectedCode: string,
) {
  await assert.rejects(
    () => getStudioSlots(studioId, date, nowProvider),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, expectedCode);
      return true;
    },
  );
}

async function assertStudioProductsAppError(
  studioId: string,
  timeSlotId: string | undefined,
  expectedCode: string,
) {
  await assert.rejects(
    () => getStudioProducts(studioId, timeSlotId, timestampNowProvider),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, expectedCode);
      return true;
    },
  );
}

function studioProduct(
  input: Partial<
    NonNullable<FindStudioProductsResult>["products"][number]
  > = {},
): NonNullable<FindStudioProductsResult>["products"][number] {
  return {
    id: 1n,
    shootingCategory: "PROFILE",
    name: "프로필 기본",
    price: 55000,
    basePeople: 1,
    shortDescription: null,
    productImages: [],
    ...input,
  };
}

function selectedTimeSlot(
  input: Partial<NonNullable<FindTimeSlotByIdResult>> = {},
): NonNullable<FindTimeSlotByIdResult> {
  return {
    id: 12n,
    studioId: 1n,
    date: new Date("2026-07-15T00:00:00.000Z"),
    startTime: time("00:30:16.000"),
    endTime: time("01:30:16.000"),
    isAvailable: true,
    ...input,
  };
}

test("studio slot lookup service", async (t) => {
  await t.test("returns slots for a valid future date", async () => {
    resetRepositoryMock();
    repositoryResult = {
      id: 123n,
      timeSlots: [
        {
          id: 9007199254740993n,
          startTime: time("09:05:00.000"),
          endTime: time("10:00:00.000"),
          isAvailable: true,
        },
      ],
    };

    const result = await getStudioSlots("123", "2026-07-16", nowProvider);

    assert.deepEqual(result, [
      {
        slotId: "9007199254740993",
        startTime: "09:05",
        endTime: "10:00",
        isAvailable: true,
      },
    ]);
    assert.equal(receivedStudioId, 123n);
    assert.equal(receivedDate?.toISOString(), "2026-07-16T00:00:00.000Z");
  });

  await t.test("maps an invalid studio id to STUDIO_4001", async () => {
    resetRepositoryMock();
    await assertAppError("0", "2026-07-16", "STUDIO_4001");
    assert.equal(repositoryCallCount, 0);
  });

  await t.test("maps a missing date to STUDIO_4001", async () => {
    resetRepositoryMock();
    await assertAppError("1", undefined, "STUDIO_4001");
    assert.equal(repositoryCallCount, 0);
  });

  await t.test("maps a nonexistent date to STUDIO_4001", async () => {
    resetRepositoryMock();
    await assertAppError("1", "2026-02-30", "STUDIO_4001");
    assert.equal(repositoryCallCount, 0);
  });

  await t.test("rejects a past KST date before repository access", async () => {
    resetRepositoryMock();
    await assertAppError("1", "2026-07-14", "STUDIO_4002");
    assert.equal(repositoryCallCount, 0);
  });

  await t.test("maps a missing studio to STUDIO_4041", async () => {
    resetRepositoryMock();
    repositoryResult = null;
    await assertAppError("1", "2026-07-16", "STUDIO_4041");
  });

  await t.test(
    "returns an empty list when the studio has no slots",
    async () => {
      resetRepositoryMock();
      const result = await getStudioSlots("1", "2026-07-16", nowProvider);
      assert.deepEqual(result, []);
    },
  );

  await t.test("preserves database availability on a future date", async () => {
    resetRepositoryMock();
    repositoryResult = {
      id: 1n,
      timeSlots: [
        {
          id: 1n,
          startTime: time("09:00:00.000"),
          endTime: time("10:00:00.000"),
          isAvailable: true,
        },
        {
          id: 2n,
          startTime: time("11:00:00.000"),
          endTime: time("12:00:00.000"),
          isAvailable: false,
        },
      ],
    };

    const result = await getStudioSlots("1", "2026-07-16", nowProvider);
    assert.deepEqual(
      result.map(({ isAvailable }) => isAvailable),
      [true, false],
    );
  });

  await t.test(
    "disables today's slot before the current KST time",
    async () => {
      resetRepositoryMock();
      repositoryResult = {
        id: 1n,
        timeSlots: [
          {
            id: 1n,
            startTime: time("00:30:14.000"),
            endTime: time("11:00:00.000"),
            isAvailable: true,
          },
        ],
      };

      const [slot] = await getStudioSlots("1", "2026-07-15", nowProvider);
      assert.equal(slot?.isAvailable, false);
    },
  );

  await t.test("disables today's slot at the current KST time", async () => {
    resetRepositoryMock();
    repositoryResult = {
      id: 1n,
      timeSlots: [
        {
          id: 1n,
          startTime: time("00:30:15.000"),
          endTime: time("11:00:00.000"),
          isAvailable: true,
        },
      ],
    };

    const [slot] = await getStudioSlots("1", "2026-07-15", nowProvider);
    assert.equal(slot?.isAvailable, false);
  });

  await t.test("keeps today's future available slot enabled", async () => {
    resetRepositoryMock();
    repositoryResult = {
      id: 1n,
      timeSlots: [
        {
          id: 1n,
          startTime: time("00:30:16.000"),
          endTime: time("11:00:00.000"),
          isAvailable: true,
        },
      ],
    };

    const [slot] = await getStudioSlots("1", "2026-07-15", nowProvider);
    assert.equal(slot?.isAvailable, true);
  });

  await t.test("keeps today's future unavailable slot disabled", async () => {
    resetRepositoryMock();
    repositoryResult = {
      id: 1n,
      timeSlots: [
        {
          id: 1n,
          startTime: time("00:30:16.000"),
          endTime: time("11:00:00.000"),
          isAvailable: false,
        },
      ],
    };

    const [slot] = await getStudioSlots("1", "2026-07-15", nowProvider);
    assert.equal(slot?.isAvailable, false);
  });

  await t.test(
    "maps an unexpected repository error to STUDIO_5001",
    async () => {
      resetRepositoryMock();
      repositoryError = new Error("unexpected repository failure");
      await assertAppError("1", "2026-07-16", "STUDIO_5001");
    },
  );

  await t.test("preserves an existing AppError", async () => {
    resetRepositoryMock();
    const existingError = new AppError("COMMON_409");
    repositoryError = existingError;

    await assert.rejects(
      () => getStudioSlots("1", "2026-07-16", nowProvider),
      (error: unknown) => {
        assert.equal(error, existingError);
        return true;
      },
    );
  });
});

test("studio products lookup service", async (t) => {
  await t.test("maps an invalid studio id to STUDIO_4001", async () => {
    resetRepositoryMock();

    await assertStudioProductsAppError("0", undefined, "STUDIO_4001");

    assert.equal(studioProductsCallCount, 0);
    assert.equal(timeSlotCallCount, 0);
  });

  await t.test("maps an invalid time slot id to STUDIO_4001", async () => {
    resetRepositoryMock();

    await assertStudioProductsAppError("1", "", "STUDIO_4001");

    assert.equal(studioProductsCallCount, 0);
    assert.equal(timeSlotCallCount, 0);
  });

  await t.test("maps a missing studio to STUDIO_4041", async () => {
    resetRepositoryMock();
    studioProductsResult = null;

    await assertStudioProductsAppError("1", undefined, "STUDIO_4041");

    assert.equal(receivedProductsStudioId, 1n);
    assert.equal(timeSlotCallCount, 0);
  });

  await t.test(
    "returns empty product groups for a studio without products",
    async () => {
      resetRepositoryMock();

      const result = await getStudioProducts(
        "1",
        undefined,
        timestampNowProvider,
      );

      assert.deepEqual(result.productGroups, []);
    },
  );

  await t.test("does not query a time slot when none is selected", async () => {
    resetRepositoryMock();

    const result = await getStudioProducts(
      "1",
      undefined,
      timestampNowProvider,
    );

    assert.equal(result.selectedSlot, null);
    assert.equal(timeSlotCallCount, 0);
  });

  await t.test("maps a missing time slot to STUDIO_4045", async () => {
    resetRepositoryMock();
    timeSlotResult = null;

    await assertStudioProductsAppError("1", "12", "STUDIO_4045");

    assert.equal(timeSlotCallCount, 1);
    assert.equal(receivedTimeSlotId, 12n);
  });

  await t.test("maps a time slot studio mismatch to STUDIO_40015", async () => {
    resetRepositoryMock();
    timeSlotResult = selectedTimeSlot({ studioId: 2n });

    await assertStudioProductsAppError("1", "12", "STUDIO_40015");
  });

  await t.test(
    "keeps a database-unavailable future slot unavailable",
    async () => {
      resetRepositoryMock();
      timeSlotResult = selectedTimeSlot({ isAvailable: false });

      const result = await getStudioProducts("1", "12", timestampNowProvider);

      assert.equal(result.selectedSlot?.isAvailable, false);
    },
  );

  await t.test("keeps a future KST slot available", async () => {
    resetRepositoryMock();
    timeSlotResult = selectedTimeSlot({
      startTime: time("00:30:16.000"),
      isAvailable: true,
    });

    const result = await getStudioProducts("1", "12", timestampNowProvider);

    assert.equal(result.selectedSlot?.isAvailable, true);
  });

  await t.test("disables a past KST slot", async () => {
    resetRepositoryMock();
    timeSlotResult = selectedTimeSlot({
      startTime: time("00:30:14.000"),
      isAvailable: true,
    });

    const result = await getStudioProducts("1", "12", timestampNowProvider);

    assert.equal(result.selectedSlot?.isAvailable, false);
  });

  await t.test("disables a slot exactly at the current time", async () => {
    resetRepositoryMock();
    timeSlotResult = selectedTimeSlot({
      startTime: time("00:30:15.000"),
      isAvailable: true,
    });

    const result = await getStudioProducts("1", "12", timestampNowProvider);

    assert.equal(result.selectedSlot?.isAvailable, false);
  });

  await t.test(
    "combines the DB date and time across the KST date boundary",
    async () => {
      resetRepositoryMock();
      timeSlotResult = selectedTimeSlot({
        date: new Date("2026-07-15T00:00:00.000Z"),
        startTime: time("00:00:00.000"),
        isAvailable: true,
      });
      const oneSecondBeforeKstMidnight = () =>
        Date.parse("2026-07-14T14:59:59.000Z");

      const result = await getStudioProducts(
        "1",
        "12",
        oneSecondBeforeKstMidnight,
      );

      assert.equal(result.selectedSlot?.isAvailable, true);
    },
  );

  await t.test(
    "groups products while preserving product, category, and image order",
    async () => {
      resetRepositoryMock();
      studioProductsResult = {
        id: 9007199254740993n,
        name: "데이지 스튜디오",
        products: [
          studioProduct({
            id: 9007199254740995n,
            shootingCategory: "PROFILE",
            name: "프로필 1",
            shortDescription: null,
            productImages: [
              { url: "https://example.com/profile-1.jpg", order: 1 },
              { url: "https://example.com/profile-2.jpg", order: 2 },
            ],
          }),
          studioProduct({
            id: 9007199254740996n,
            shootingCategory: "PERSONAL_PORTRAIT",
            name: "화보 1",
            productImages: [
              { url: "https://example.com/portrait.jpg", order: 1 },
            ],
          }),
          studioProduct({
            id: 9007199254740997n,
            shootingCategory: "PROFILE",
            name: "프로필 2",
          }),
        ],
      };

      const result = await getStudioProducts(
        "9007199254740993",
        undefined,
        timestampNowProvider,
      );

      assert.equal(result.studioId, "9007199254740993");
      assert.deepEqual(
        result.productGroups.map((group) => group.shootingCategory),
        ["PROFILE", "PERSONAL_PORTRAIT"],
      );
      assert.deepEqual(
        result.productGroups[0]?.products.map((product) => product.productName),
        ["프로필 1", "프로필 2"],
      );
      assert.deepEqual(result.productGroups[0]?.products[0], {
        studioProductId: "9007199254740995",
        productName: "프로필 1",
        imageUrls: [
          "https://example.com/profile-1.jpg",
          "https://example.com/profile-2.jpg",
        ],
        price: 55000,
        basePeople: 1,
        shortDescription: null,
        imageCount: 2,
      });
    },
  );

  await t.test("serializes a selected slot id through the DTO", async () => {
    resetRepositoryMock();
    timeSlotResult = selectedTimeSlot({ id: 9007199254740993n });

    const result = await getStudioProducts(
      "1",
      "9007199254740993",
      timestampNowProvider,
    );

    assert.equal(result.selectedSlot?.timeSlotId, "9007199254740993");
  });

  await t.test(
    "maps a studio products repository error to COMMON_500",
    async () => {
      resetRepositoryMock();
      studioProductsError = new Error("unexpected studio products failure");

      await assertStudioProductsAppError("1", undefined, "COMMON_500");
    },
  );

  await t.test("maps a time slot repository error to COMMON_500", async () => {
    resetRepositoryMock();
    timeSlotError = new Error("unexpected time slot failure");

    await assertStudioProductsAppError("1", "12", "COMMON_500");
  });

  await t.test("preserves an existing AppError", async () => {
    resetRepositoryMock();
    const existingError = new AppError("STUDIO_4041");
    studioProductsError = existingError;

    await assert.rejects(
      () => getStudioProducts("1", undefined, timestampNowProvider),
      (error: unknown) => {
        assert.equal(error, existingError);
        assert.equal((error as AppError).code, "STUDIO_4041");
        return true;
      },
    );
  });
});
