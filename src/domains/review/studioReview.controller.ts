import {
  Controller,
  Get,
  Path,
  Query,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import type { GetReviewsSuccessResponseDto } from "./review.dto.js";
import * as reviewService from "./review.service.js";

// 인증 미들웨어(expressAuthentication)가 request.userId를 채워준다
type AuthenticatedRequest = { userId: bigint };

// 경로가 studios/{studioId}/reviews 라 리뷰 도메인 소유의 별도 컨트롤러로 분리
@Route("studios")
@Tags("Review")
@Security("jwt")
export class StudioReviewController extends Controller {
  /** 사진관 리뷰 목록 조회 */
  @Get("{studioId}/reviews")
  @SuccessResponse(200, "OK")
  public async listByStudio(
    @Path() studioId: number,
    @Request() request: any,
    @Query() sort?: string,
    @Query() photoOnly?: boolean,
    @Query() page?: number,
    @Query() size?: number,
  ): Promise<GetReviewsSuccessResponseDto> {
    const { userId } = request as AuthenticatedRequest;
    const data = await reviewService.getReviews(userId, studioId, {
      ...(sort !== undefined && { sort }),
      ...(photoOnly !== undefined && { photoOnly }),
      ...(page !== undefined && { page }),
      ...(size !== undefined && { size }),
    });

    return {
      success: true,
      code: "COMMON_200",
      message: "리뷰 목록 조회에 성공했습니다.",
      data,
    };
  }
}
