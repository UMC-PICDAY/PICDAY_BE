import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { AppError } from "../../common/error.js";
import type { CreateReservationOutcome } from "./reservation.repository.js";

const validBody = {
  studioId: 1,
  studioProductId: 5,
  timeSlotId: 12,
  reserveeName: "김연희",
  reserveePhone: "01012345678",
  paymentMethod: "KAKAOPAY" as const,
  agreedTermIds: [1],
};

type ReservationCreationReferences = {
  studio: { id: bigint } | null;
  studioProduct: { id: bigint; studioId: bigint; price: number } | null;
  timeSlot: {
    id: bigint;
    studioId: bigint;
    date: Date;
    startTime: Date;
    endTime: Date;
    isAvailable: boolean;
  } | null;
  requiredTerms: Array<{
    id: bigint;
    type: "REFUND_POLICY";
    version: string;
  }>;
};

function dateAtLocalTime(dayOffset: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function defaultReferences(): ReservationCreationReferences {
  return {
    studio: { id: 1n },
    studioProduct: { id: 5n, studioId: 1n, price: 150_000 },
    timeSlot: {
      id: 12n,
      studioId: 1n,
      date: dateAtLocalTime(1, 0),
      startTime: dateAtLocalTime(0, 10),
      endTime: dateAtLocalTime(0, 11),
      isAvailable: true,
    },
    requiredTerms: [{ id: 1n, type: "REFUND_POLICY", version: "1.0" }],
  };
}

const createdAt = new Date("2026-07-04T16:16:26.000Z");
const createdOutcome: CreateReservationOutcome = {
  kind: "CREATED",
  reservation: {
    id: 105n,
    status: "RESERVED",
    totalPrice: 150_000,
    createdAt,
  },
};

let references = defaultReferences();
let outcome: CreateReservationOutcome = createdOutcome;
let referenceError: unknown;
let creationError: unknown;
let receivedCreationInput: unknown;

function resetRepositoryMock() {
  references = defaultReferences();
  outcome = createdOutcome;
  referenceError = undefined;
  creationError = undefined;
  receivedCreationInput = undefined;
}

mock.module("./reservation.repository.js", {
  namedExports: {
    async findReservationCreationReferences() {
      if (referenceError) {
        throw referenceError;
      }
      return references;
    },
    async createReservation(input: unknown) {
      receivedCreationInput = input;
      if (creationError) {
        throw creationError;
      }
      return outcome;
    },
  },
});

const { create } = await import("./reservation.service.js");

async function assertAppError(body: unknown, expectedCode: string) {
  await assert.rejects(
    () => create(body, 9n),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, expectedCode);
      return true;
    },
  );
}

test("reservation creation service", async (t) => {
  await t.test("creates a reservation normally", async () => {
    resetRepositoryMock();

    const result = await create(validBody, 9n);

    assert.deepEqual(result, {
      reservationId: 105,
      status: "RESERVED",
      totalPrice: 150_000,
      createdAt: "2026-07-04T16:16:26.000Z",
    });
    assert.deepEqual(receivedCreationInput, {
      studioId: 1n,
      studioProductId: 5n,
      timeSlotId: 12n,
      reserveeName: "김연희",
      reserveePhone: "01012345678",
      paymentMethod: "KAKAOPAY",
      agreedTermIds: [1n],
      userId: 9n,
    });
  });

  await t.test(
    "maps a missing reservee name or phone to RESERVATION_4001",
    async () => {
      for (const field of ["reserveeName", "reserveePhone"] as const) {
        resetRepositoryMock();
        const body: Partial<typeof validBody> = { ...validBody };
        delete body[field];
        await assertAppError(body, "RESERVATION_4001");
      }
    },
  );

  await t.test("maps another invalid request to RESERVATION_4005", async () => {
    resetRepositoryMock();
    await assertAppError(
      { ...validBody, reserveePhone: "010-1234-5678" },
      "RESERVATION_4005",
    );
  });

  await t.test(
    "maps a missing studio, product, or time slot to RESERVATION_4043",
    async () => {
      for (const resource of ["studio", "studioProduct", "timeSlot"] as const) {
        resetRepositoryMock();
        references[resource] = null;
        await assertAppError(validBody, "RESERVATION_4043");
      }
    },
  );

  await t.test(
    "maps a product or slot studio mismatch to RESERVATION_4006",
    async () => {
      resetRepositoryMock();
      assert.ok(references.studioProduct);
      references.studioProduct.studioId = 2n;
      await assertAppError(validBody, "RESERVATION_4006");

      resetRepositoryMock();
      assert.ok(references.timeSlot);
      references.timeSlot.studioId = 2n;
      await assertAppError(validBody, "RESERVATION_4006");
    },
  );

  await t.test("maps missing required terms to RESERVATION_4007", async () => {
    resetRepositoryMock();
    await assertAppError(
      { ...validBody, agreedTermIds: [2] },
      "RESERVATION_4007",
    );
  });

  await t.test("maps an unknown agreed term to RESERVATION_4005", async () => {
    resetRepositoryMock();
    outcome = {
      kind: "TERMS_INVALID",
      requiredTermIds: [1n],
      missingRequiredTermIds: [],
      unknownAgreedTermIds: [99n],
    };

    await assertAppError(
      { ...validBody, agreedTermIds: [1, 99] },
      "RESERVATION_4005",
    );
  });

  await t.test("maps a past slot to RESERVATION_4004", async () => {
    resetRepositoryMock();
    assert.ok(references.timeSlot);
    references.timeSlot.date = dateAtLocalTime(-1, 0);
    await assertAppError(validBody, "RESERVATION_4004");
  });

  await t.test("maps a slot conflict to RESERVATION_4091", async () => {
    resetRepositoryMock();
    outcome = { kind: "SLOT_CONFLICT" };
    await assertAppError(validBody, "RESERVATION_4091");
  });

  await t.test(
    "maps an unexpected repository error to RESERVATION_5001",
    async () => {
      resetRepositoryMock();
      creationError = new Error("unexpected repository failure");
      await assertAppError(validBody, "RESERVATION_5001");
    },
  );

  await t.test("serializes reservation id and createdAt", async () => {
    resetRepositoryMock();
    const result = await create(validBody, 9n);

    assert.equal(typeof result.reservationId, "number");
    assert.equal(typeof result.createdAt, "string");
    assert.equal(new Date(result.createdAt).toISOString(), result.createdAt);
  });
});
