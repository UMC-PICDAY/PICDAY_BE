import cron from "node-cron";
import {
  completeExpiredReservations,
  type CompleteExpiredReservationsResult,
} from "../domains/reservation/reservation.service.js";

export type CompleteExpiredReservationsBatchRunResult =
  | {
      status: "completed";
      result: CompleteExpiredReservationsResult;
    }
  | {
      status: "skipped-overlap";
    }
  | {
      status: "failed";
      error: unknown;
    };

let isRunning = false;

function logCompletionResult(result: CompleteExpiredReservationsResult) {
  if (result.completedCount > 0) {
    console.log(
      "[ReservationCompletionBatch] completed",
      `scanned=${result.scannedCount}`,
      `expired=${result.expiredCount}`,
      `completed=${result.completedCount}`,
      `invalid=${result.skippedInvalidSlotCount}`,
    );
  }

  if (result.skippedInvalidSlotCount > 0) {
    console.warn(
      "[ReservationCompletionBatch] invalid slots skipped",
      `scanned=${result.scannedCount}`,
      `invalid=${result.skippedInvalidSlotCount}`,
    );
  }
}

function logCompletionError(error: unknown) {
  if (error instanceof Error) {
    console.error(
      "[ReservationCompletionBatch] failed",
      `name=${error.name}`,
      `message=${error.message}`,
    );
    return;
  }

  console.error("[ReservationCompletionBatch] failed", error);
}

export async function runCompleteExpiredReservationsBatch(): Promise<CompleteExpiredReservationsBatchRunResult> {
  if (isRunning) {
    return { status: "skipped-overlap" };
  }

  isRunning = true;

  try {
    const result = await completeExpiredReservations();
    logCompletionResult(result);

    return {
      status: "completed",
      result,
    };
  } catch (error) {
    logCompletionError(error);

    return {
      status: "failed",
      error,
    };
  } finally {
    isRunning = false;
  }
}

export function startCompleteExpiredReservationsBatch() {
  return cron.schedule(
    "* * * * *",
    async () => {
      await runCompleteExpiredReservationsBatch();
    },
    {
      timezone: "Asia/Seoul",
      noOverlap: true,
    },
  );
}
