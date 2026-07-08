import { Router } from "express";

export const studioRouter = Router();

// 특정 스튜디오의 예약 가능 시간 조회
studioRouter.get("/:studioId/slots", (req, res) => {
  res.send("예약 가능 시간 조회 API 연결 성공");
});
