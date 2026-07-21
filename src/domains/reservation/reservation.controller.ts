import {
  Body,
  Controller,
  Path,
  Post,
  Patch,
  Get,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
  Query
} from "tsoa";
import { success } from "../../common/response.js";
import {
  cancelReservationResponseSchema,
  reservationIdParamsSchema,
  getMyReservationListQuerySchema,
  type CreateReservationRequestDto,
  type CreateReservationSuccessResponseDto,
} from "./reservation.dto.js";
import * as reservationService from "./reservation.service.js";

// 인증 미들웨어(expressAuthentication)가 request.userId를 채워준다
type AuthenticatedRequest = { userId: bigint };

@Route("reservations")
@Tags("Reservation")
@Security("jwt")
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
  public async cancel(
    @Path() reservationId: string,
    @Request() request: any,
  ) {
    const { reservationId: id } = reservationIdParamsSchema.parse({
      reservationId,
    });

    const { userId } = request as AuthenticatedRequest;

    const result = await reservationService.cancel(BigInt(id), userId);

    return success(result);
  }

  @Get("{reservationId}")
  @SuccessResponse(200, "OK")
  public async detail(
    @Path() reservationId: string,
    @Request() request: any
  ){
    const { reservationId: id } = reservationIdParamsSchema.parse({ reservationId });
    const { userId } = request as AuthenticatedRequest;

    const result = await reservationService.getDetail(BigInt(id), userId);
    
    return success(result);
  }

  @Get()
  @SuccessResponse(200, "OK")
  public async list(
    @Request() request: any,
    @Query() status?: string,
  ) {
    const { status: parsedStatus } = getMyReservationListQuerySchema.parse({ status });
    const userId = request.userId ?? BigInt(1); // TODO: 인증 미들웨어 머지 후 request.userId로 교체

    const result = await reservationService.list(userId, parsedStatus);

    return success(result);
  }
}
