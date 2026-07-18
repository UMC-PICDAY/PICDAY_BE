import assert from "node:assert/strict";
import { beforeEach, mock, test } from "node:test";
import { AppError } from "../../common/error.js";
import type { StudioProductsResponseDto } from "./studio.dto.js";

const serviceResult: StudioProductsResponseDto = {
  studioId: "1",
  studioName: "데이지 스튜디오",
  selectedSlot: null,
  productGroups: [],
};

let receivedStudioId: string | undefined;
let receivedTimeSlotId: string | undefined;
let serviceError: unknown;

mock.module("./studio.service.js", {
  namedExports: {
    async getStudioSlots() {
      return [];
    },
    async getStudioProducts(studioId: string, timeSlotId?: string) {
      receivedStudioId = studioId;
      receivedTimeSlotId = timeSlotId;

      if (serviceError) {
        throw serviceError;
      }
      return serviceResult;
    },
  },
});

const { StudioController } = await import("./studio.controller.js");

beforeEach(() => {
  receivedStudioId = undefined;
  receivedTimeSlotId = undefined;
  serviceError = undefined;
});

test("passes an omitted timeSlotId to the service as undefined", async () => {
  const controller = new StudioController();

  const response = await controller.getStudioProducts("1");

  assert.equal(receivedStudioId, "1");
  assert.equal(receivedTimeSlotId, undefined);
  assert.deepEqual(response, {
    success: true,
    code: "COMMON_200",
    message: "사진관 컨셉 목록 조회에 성공했습니다.",
    data: serviceResult,
  });
});

test("passes a selected timeSlotId to the service unchanged", async () => {
  const controller = new StudioController();

  await controller.getStudioProducts("1", "9007199254740993");

  assert.equal(receivedStudioId, "1");
  assert.equal(receivedTimeSlotId, "9007199254740993");
});

test("propagates a service AppError without converting it", async () => {
  const controller = new StudioController();
  const error = new AppError("STUDIO_4041");
  serviceError = error;

  await assert.rejects(
    () => controller.getStudioProducts("1"),
    (receivedError: unknown) => {
      assert.equal(receivedError, error);
      return true;
    },
  );
});
