// reservation.controller.ts
import { Controller, Route, Patch, Path } from "tsoa";
import * as reservationService from "./reservation.service.js";
import { cancelReservationResponseSchema, reservationIdParamsSchema } from "./reservation.dto.js";
import { resourceLimits } from "node:worker_threads";
import { success } from "../../common/response.js";

@Route("reservations")
export class ReservationController extends Controller {
  @Patch("{reservationId}/cancel")
  public async cancel(@Path() reservationId: string) {
    const {reservationId: id} = reservationIdParamsSchema.parse({reservationId});

    const result = await reservationService.cancel(id);

    return success(result);
  }
}