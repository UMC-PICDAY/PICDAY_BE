// src/recalculatePopularityRank.ts
// 재계산 : pnpm rank:recalculate

// 홈 화면의 배너(평균 평점)/'지금 인기 있는 사진관'(예약 완료 건수) 랭킹을 재계산하는 배치 스크립트.
// 실제 "하루 1회 실행"은 배포 인프라(cron/GitHub Actions 등)에서 이 스크립트를 호출하도록 연결한다.
import "dotenv/config";
import { prisma } from "./config/prisma.js";

// 스튜디오 id, 평균 평점/예약 완료 건수 최종 점수
type RankedScore = { id: bigint; score: number };

// 랭킹 계산 함수 : 점수 기준 내림차순 정렬 후, 동점이면 id 오름차순으로 정렬하여 순위 부여
function assignRanks(entries: RankedScore[]): Map<bigint, number> {
  const sorted = [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  return new Map(sorted.map((entry, index) => [entry.id, index + 1])); // 순위는 1부터 시작
}

async function main() {
  // 1. 평균 평점 집계

  // 전체 사진관 id 목록
  const studios = await prisma.studio.findMany({ select: { id: true } });
  // 사진관별 평균 평점 목록
  const ratings = await prisma.review.groupBy({
    by: ["studioId"],
    _avg: { rating: true },
  });
  const ratingByStudioId = new Map(
    ratings.map((row) => [row.studioId, row._avg.rating ?? 0]), // 리뷰 없는 사진관은 기본값 0점으로 처리
  );

  // 2. 예약 완료 건수 집계

  // 예약 완료된 사진관 id 목록
  const completedReservations = await prisma.reservation.findMany({
    where: { status: "COMPLETED" },
    select: { studioProduct: { select: { studioId: true } } },
  });
  // 사진관별 예약 완료 건수 집계
  const reservationCountByStudioId = new Map<bigint, number>();
  for (const reservation of completedReservations) {
    const studioId = reservation.studioProduct.studioId;
    reservationCountByStudioId.set(
      studioId,
      (reservationCountByStudioId.get(studioId) ?? 0) + 1,
    );
  }

  // 3-1. DB에 들어갈 사진관 별 평균 평점/예약 완료 건수 매핑
  // 평점 기준
  const ratingScores: RankedScore[] = studios.map((studio) => ({
    id: studio.id,
    score: ratingByStudioId.get(studio.id) ?? 0,
  }));
  // 예약 완료 건수 기준 랭킹
  const reservationScores: RankedScore[] = studios.map((studio) => ({
    id: studio.id,
    score: reservationCountByStudioId.get(studio.id) ?? 0,
  }));

  // 3-2. 랭킹 계산 후 매핑
  const ratingRankByStudioId = assignRanks(ratingScores);
  const reservationRankByStudioId = assignRanks(reservationScores);

  // 4. DB 업데이트
  await prisma.$transaction(
    studios.map((studio) =>
      prisma.studio.update({
        where: { id: studio.id },
        data: {
          ratingScore: ratingByStudioId.get(studio.id) ?? 0,
          ratingRank: ratingRankByStudioId.get(studio.id) ?? null,
          reservationCount: reservationCountByStudioId.get(studio.id) ?? 0,
          reservationRank: reservationRankByStudioId.get(studio.id) ?? null,
        },
      }),
    ),
  );

  console.log(`재집계 완료: 사진관 ${studios.length}곳`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
