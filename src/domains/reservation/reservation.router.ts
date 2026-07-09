import { Router } from "express";

export const reservationRouter = Router();

// 예약 생성
reservationRouter.post("/", (req, res) => {
  res.send("예약 생성 API 연결 성공");
});

// 내 예약 내역 목록 조회
reservationRouter.get("/", (req, res) => {
  res.send("내 예약 내역 목록 조회 API 연결 성공");
});

// 예약 상세
reservationRouter.get("/:reservationId", (req, res) => {
  res.send("예약 상세 조회 API 연결 성공");
});

// 예약 취소
reservationRouter.patch("/:reservationId/cancel", (req, res) => {
  res.send("예약 취소 API 연결 성공");
});
