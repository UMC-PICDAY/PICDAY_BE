// reservation.controller.ts
import { Controller, Route, Tags, Get, Post, Patch, Path, Body, SuccessResponse } from "tsoa";
import {
  //createReservationSchema,
  reservationIdParamsSchema,
  cancelReservationResponseSchema,
} from "./reservation.dto.js";
import * as reservationService from "./reservation.service.js";

@Route("reservations")
@Tags("Reservation")
export class ReservationController extends Controller {
  /** 예약 생성 */
  @Post()
  @SuccessResponse(201, "Created")
  public async create(@Body() body: unknown) {
    
  }

  /** 내 예약 내역 목록 조회 */
  @Get()
  public async list() {
    
  }

  /** 예약 상세 조회 */
  @Get("{reservationId}")
  public async detail(@Path() reservationId: string) {
    
  }

  /** 예약 취소 */
  @Patch("{reservationId}/cancel")
  public async cancel(@Path() reservationId: string) {
    const { reservationId: id } = reservationIdParamsSchema.parse({ reservationId });
    return reservationService.cancel(id);
  }
}