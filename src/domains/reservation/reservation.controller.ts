// reservation.controller.ts
import { Controller, Route, Patch, Path } from "tsoa";
import * as reservationService from "./reservation.service.js";

@Route("reservations")
export class ReservationController extends Controller {
  @Patch("{reservationId}/cancel")
  public async cancel(@Path() reservationId: string) {
    return reservationService.cancel(reservationId);
  }
}