import {
  Body,
  Controller,
  Patch,
  Path,
  Post,
  Request,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import type {
  CreateReservationRequestDto,
  CreateReservationSuccessResponseDto,
} from "./reservation.dto.js";
import * as reservationService from "./reservation.service.js";

type AuthenticatedRequest = { userId: bigint };

@Route("reservations")
@Tags("Reservation")
export class ReservationController extends Controller {
  @Post()
  @SuccessResponse(201, "Created")
  public async create(
    @Body() body: CreateReservationRequestDto,
    @Request() request: any,
  ): Promise<CreateReservationSuccessResponseDto> {
    const { userId } = request as AuthenticatedRequest;
    const data = await reservationService.createReservation(body, userId);

    this.setStatus(201);
    return {
      success: true,
      code: "COMMON_201",
      message: "예약이 성공적으로 완료되었습니다.",
      data,
    };
  }

  @Patch("{reservationId}/cancel")
  @SuccessResponse(200, "OK")
  public async cancel(@Path() reservationId: string) {
    return reservationService.cancel(reservationId);
  }
}
