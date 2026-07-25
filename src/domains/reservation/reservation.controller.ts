import {
  Body,
  Controller,
  Get,
  Middlewares,
  Patch,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import { AppError } from "../../common/error.js";
import { success } from "../../common/response.js";
import {
  getMyReservationListQuerySchema,
  reservationIdParamsSchema,
  type CreateReservationRequestDto,
  type CreateReservationSuccessResponseDto,
} from "./reservation.dto.js";
import {
  validateCreateReservationRequest,
  validateReservationId,
} from "./reservation.middleware.js";
import * as reservationService from "./reservation.service.js";

// 인증 미들웨어(expressAuthentication)가 request.userId를 채워준다
type AuthenticatedRequest = {
  userId: bigint;
};

function parseReservationId(reservationId: number): bigint {
  const result = reservationIdParamsSchema.safeParse({ reservationId });

  if (!result.success) {
    throw new AppError("RESERVATION_4005");
  }

  return result.data.reservationId;
}

/**
 * 예약(Reservation) 도메인 API
 *
 * 스튜디오 촬영 예약의 생성/조회/취소를 담당한다.
 * 모든 엔드포인트는 JWT 인증(Bearer Token)이 필요하며,
 * 조회·취소 API는 요청자 본인 소유의 예약인지 검증한다.
 */
@Route("reservations")
@Tags("Reservation")
@Security("jwt")
export class ReservationController extends Controller {
  /**
   * 예약 생성
   *
   * 스튜디오/상품/타임슬롯을 지정해 새 예약을 생성한다.
   * 필수 약관 동의, 타임슬롯 유효성(과거 여부·중복 예약)을 검증한 뒤
   * 결제 정보와 함께 예약을 확정한다.
   *
   * @summary 예약 생성
   */
  @Post()
  @Middlewares(validateCreateReservationRequest)
  @SuccessResponse(201, "Created")
  public async create(
    @Body() body: CreateReservationRequestDto,
    @Request() request: any,
  ): Promise<CreateReservationSuccessResponseDto> {
    const { userId } = request as AuthenticatedRequest;
    const data = await reservationService.create(body, userId);

    this.setStatus(201);

    return {
      success: true,
      code: "COMMON_201",
      message: "예약이 성공적으로 완료되었습니다.",
      data,
    };
  }

  /**
   * 예약 취소
   *
   * 본인 소유의 예약을 취소 처리한다.
   * 이미 취소되었거나 완료된 예약, 촬영 당일 취소 요청은 거부된다.
   *
   * @summary 예약 취소
   * @param reservationId 취소할 예약 ID
   * @isLong reservationId 예약 ID는 정수여야 합니다.
   * @minimum reservationId 1 예약 ID는 양수여야 합니다.
   * @maximum reservationId 9007199254740991 예약 ID가 허용 범위를 초과했습니다.
   */
  @Patch("{reservationId}/cancel")
  @Middlewares(validateReservationId)
  @SuccessResponse(200, "OK")
  public async cancel(@Path() reservationId: number, @Request() request: any) {
    const id = parseReservationId(reservationId);

    const { userId } = request as AuthenticatedRequest;
    const result = await reservationService.cancel(id, userId);

    return success(result);
  }

  /**
   * 예약 상세 조회
   *
   * 예약 1건의 상세 정보(스튜디오/상품/타임슬롯/결제 금액 등)를 조회한다.
   * 본인 소유가 아니거나 존재하지 않는 예약은 동일한 에러 코드로 응답해
   * 예약 존재 여부가 노출되지 않도록 한다.
   *
   * @summary 예약 상세 조회
   * @param reservationId 조회할 예약 ID
   * @isLong reservationId 예약 ID는 정수여야 합니다.
   * @minimum reservationId 1 예약 ID는 양수여야 합니다.
   * @maximum reservationId 9007199254740991 예약 ID가 허용 범위를 초과했습니다.
   */
  @Get("{reservationId}")
  @Middlewares(validateReservationId)
  @SuccessResponse(200, "OK")
  public async detail(@Path() reservationId: number, @Request() request: any) {
    const id = parseReservationId(reservationId);

    const { userId } = request as AuthenticatedRequest;
    const result = await reservationService.getDetail(id, userId);

    return success(result);
  }

  /**
   * 내 예약 목록 조회
   *
   * 요청자 본인의 예약 목록을 조회한다.
   * status 쿼리로 예약 상태(RESERVED/COMPLETED/CANCELLED)별 필터링이 가능하다.
   *
   * @summary 내 예약 목록 조회
   * @param status 예약 상태 필터 (미지정 시 전체 조회)
   */
  @Get()
  @SuccessResponse(200, "OK")
  public async list(@Request() request: any, @Query() status?: string) {
    const { status: parsedStatus } = getMyReservationListQuerySchema.parse({
      status,
    });

    const { userId } = request as AuthenticatedRequest;
    const result = await reservationService.list(userId, parsedStatus);

    return success(result);
  }
}
