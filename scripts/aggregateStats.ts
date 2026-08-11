// scripts/aggregateStats.ts
//
// StudioDailyStats 배치 집계 스크립트
// [집계]
// - rating_score 기준 전체 스튜디오 순위(ratingRank) 계산
// - 완료된 예약 건수(reservationCount) 집계
// - 예약 건수 기준 순위(reservationRank) 계산
// [UPSERT]
// - studio_daily_stats 테이블에 UPSERT (idempotent)
//
// 실행 방법:
//   pnpm tsx scripts/aggregateStats.ts                   → 어제 날짜 기준 집계
//   pnpm tsx scripts/aggregateStats.ts --date=2026-08-10 → 특정 날짜 재처리(backfill)
//
// 서버 실행 없이 동작: .env의 DATABASE_URL만 정확하면 어느 환경에서 실행해도 동일 동작
import "dotenv/config";
import { prisma } from "../src/config/prisma.js";
import { ReservationStatus } from "../src/generated/prisma/client.js";

// 집계 대상 날짜를 'YYYY-MM-DD' 문자열로 반환
// --date= 인자가 있으면 해당 날짜(backfill), 없으면 어제 날짜를 기본값으로 사용
function getTargetDateString(): string {
  const dateArg = process.argv.find((arg) => arg.startsWith("--date=")); // "--date=2026-08-10"
  if (dateArg) {
    return dateArg.split("=")[1]; // '2026-08-10'
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  // ISO 형식("2026-08-10T00:00:00.000Z")에서 앞쪽 날짜 부분("2026-08-10")만 잘라냄
  return yesterday.toISOString().split("T")[0];
}

async function aggregateStudioDailyStats() {
  const dateStr = getTargetDateString();
  const statDate = new Date(dateStr);

  console.log(`[BATCH] ${dateStr} 기준 StudioDailyStats 집계 시작`);

  try {
    // 1. rating_score 기준 전체 스튜디오 정렬
    //    (rating_score는 리뷰 CRUD 시 이미 실시간 갱신되는 값 → 배치는 "정렬"만 담당)
    const studios = await prisma.studio.findMany({
      select: { id: true },
      orderBy: { ratingScore: "desc" },
    });

    if (studios.length === 0) {
      console.log("[BATCH] 대상 스튜디오 없음, 종료");
      return;
    }

    // 2. 완료된 예약 건수 집계
    //    (reservation → studio_product → studio_id 경유)
    //    "그 날 하루"가 아니라 실행 시점까지의 전체 누적 완료 건수
    const reservationRows = await prisma.$queryRaw<
      { studioId: bigint; cnt: bigint }[]
    >`
      SELECT sp.studio_id AS studioId, COUNT(*) AS cnt
      FROM reservation r
      JOIN studio_product sp ON r.studio_product_id = sp.id
      WHERE r.status = ${ReservationStatus.COMPLETED}
      GROUP BY sp.studio_id
    `;

    const reservationCountMap = new Map(
      reservationRows.map((row) => [row.studioId.toString(), Number(row.cnt)]),
    );

    // 3. 예약 건수 기준 순위 계산 (건수 내림차순)
    const sortedByReservation = [...reservationCountMap.entries()].sort(
      (a, b) => b[1] - a[1],
    );
    const reservationRankMap = new Map(
      sortedByReservation.map(([studioId], idx) => [studioId, idx + 1]),
    );

    // 4. UPSERT
    let successCount = 0;
    for (let i = 0; i < studios.length; i++) {
      const studioId = studios[i].id; // BigInt
      const studioIdStr = studioId.toString();

      const ratingRank = i + 1;
      const reservationCount = reservationCountMap.get(studioIdStr) || 0;
      // 완료 예약이 아예 없는 스튜디오는 전체 스튜디오 수 기준 최하위로 처리
      const reservationRank =
        reservationRankMap.get(studioIdStr) || studios.length;

      await prisma.studioDailyStats.upsert({
        where: {
          studioId_statDate: {
            studioId,
            statDate,
          },
        },
        update: {
          ratingRank,
          reservationCount,
          reservationRank,
        },
        create: {
          studioId,
          statDate,
          ratingRank,
          reservationCount,
          reservationRank,
        },
      });

      successCount++;
    }

    console.log(`[BATCH] 완료: ${successCount}개 스튜디오 처리 (${dateStr})`);
  } catch (err) {
    console.error("[BATCH] 실패:", err);
    process.exit(1); // cron 로그/모니터링에서 실패 감지 가능하도록
  } finally {
    await prisma.$disconnect();
  }
}

aggregateStudioDailyStats();
