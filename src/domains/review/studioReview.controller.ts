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
import { setSuccessMessage } from "../../common/response.js";
import * as reviewService from "./review.service.js";

// 인증 미들웨어(expressAuthentication)가 request.userId를 채워준다
type AuthenticatedRequest = { userId: bigint };

// 경로가 studios/{studioId}/reviews 라 리뷰 도메인 소유의 별도 컨트롤러로 분리
@Route("studios")
@Tags("Review")
@Security("jwt")
export class StudioReviewController extends Controller {
  /**
   * 사진관 리뷰 목록 조회
   *
   * 지정한 사진관의 리뷰와 평점 요약을 페이지 단위로 조회한다.
   * 정렬 기준과 사진 리뷰 여부를 선택할 수 있다.
   *
   * @summary 사진관 리뷰 목록 조회
   * @param studioId 조회할 사진관 ID
   * @param sort 정렬 기준 (recent, recommend, ratingHigh, ratingLow)
   * @param photoOnly 사진 리뷰만 조회할지 여부
   * @param page 페이지 번호 (기본값: 1)
   * @param size 페이지당 항목 수 (기본값: 10, 최대: 50)
   */
  @Get("{studioId}/reviews")
  @SuccessResponse(200, "사진관 리뷰 목록 조회 성공")
  public async listByStudio(
    @Path() studioId: number,
    @Request() request: any,
    @Query() sort?: string,
    @Query() photoOnly?: boolean,
    @Query() page?: number,
    @Query() size?: number,
  ) {
    const { userId } = request as AuthenticatedRequest;
    const data = await reviewService.getReviews(userId, studioId, {
      ...(sort !== undefined && { sort }),
      ...(photoOnly !== undefined && { photoOnly }),
      ...(page !== undefined && { page }),
      ...(size !== undefined && { size }),
    });

    setSuccessMessage(this, "리뷰 목록 조회에 성공했습니다.");
    return data;
  }
}
