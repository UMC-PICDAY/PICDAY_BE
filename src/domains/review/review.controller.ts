import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import { setSuccessMessage } from "../../common/response.js";
import type {
  CreateReviewRequestDto,
  UpdateReviewRequestDto,
} from "./review.dto.js";
import * as reviewService from "./review.service.js";

// 인증 미들웨어(expressAuthentication)가 request.userId를 채워준다
type AuthenticatedRequest = { userId: bigint };

@Route("reviews")
@Tags("Review")
@Security("jwt")
export class ReviewController extends Controller {
  /**
   * 리뷰 작성
   *
   * 촬영이 완료된 본인의 예약에 리뷰를 작성한다.
   * 하나의 예약에는 리뷰를 한 번만 작성할 수 있다.
   *
   * @summary 리뷰 작성
   * @param body 리뷰 작성 정보
   */
  @Post()
  @SuccessResponse(201, "리뷰 작성 성공")
  public async create(
    @Body() body: CreateReviewRequestDto,
    @Request() request: any,
  ) {
    const { userId } = request as AuthenticatedRequest;
    const data = await reviewService.createReview(userId, body);

    this.setStatus(201);
    setSuccessMessage(this, "리뷰가 등록되었습니다.");
    return data;
  }

  /**
   * 내 리뷰 상세 조회
   *
   * 로그인한 사용자가 작성한 리뷰 한 건의 상세 정보를 조회한다.
   *
   * @summary 내 리뷰 상세 조회
   * @param reviewId 조회할 리뷰 ID
   */
  @Get("{reviewId}")
  @SuccessResponse(200, "리뷰 상세 조회 성공")
  public async detail(@Path() reviewId: number, @Request() request: any) {
    const { userId } = request as AuthenticatedRequest;
    const data = await reviewService.getReviewDetail(userId, reviewId);

    setSuccessMessage(this, "리뷰 조회에 성공했습니다.");
    return data;
  }

  /**
   * 리뷰 수정
   *
   * 로그인한 사용자가 작성한 리뷰를 부분 수정한다.
   * imageUrls를 전달하면 기존 이미지 목록 전체를 교체한다.
   *
   * @summary 리뷰 수정
   * @param reviewId 수정할 리뷰 ID
   * @param body 수정할 리뷰 정보
   */
  @Patch("{reviewId}")
  @SuccessResponse(200, "리뷰 수정 성공")
  public async update(
    @Path() reviewId: number,
    @Body() body: UpdateReviewRequestDto,
    @Request() request: any,
  ) {
    const { userId } = request as AuthenticatedRequest;
    const data = await reviewService.updateReview(userId, reviewId, body);

    setSuccessMessage(this, "리뷰가 수정되었습니다.");
    return data;
  }

  /**
   * 리뷰 삭제
   *
   * 로그인한 사용자가 작성한 리뷰를 삭제한다.
   *
   * @summary 리뷰 삭제
   * @param reviewId 삭제할 리뷰 ID
   */
  @Delete("{reviewId}")
  @SuccessResponse(200, "리뷰 삭제 성공")
  public async remove(@Path() reviewId: number, @Request() request: any) {
    const { userId } = request as AuthenticatedRequest;
    const data = await reviewService.removeReview(userId, reviewId);

    setSuccessMessage(this, "리뷰가 삭제되었습니다.");
    return data;
  }

  /**
   * 리뷰 추천
   *
   * 지정한 리뷰에 도움돼요를 등록한다.
   *
   * @summary 리뷰 추천
   * @param reviewId 추천할 리뷰 ID
   */
  @Post("{reviewId}/like")
  @SuccessResponse(201, "리뷰 추천 성공")
  public async addLike(@Path() reviewId: number, @Request() request: any) {
    const { userId } = request as AuthenticatedRequest;
    const data = await reviewService.addLike(userId, reviewId);

    this.setStatus(201);
    setSuccessMessage(this, "리뷰를 추천했습니다.");
    return data;
  }

  /**
   * 리뷰 추천 취소
   *
   * 지정한 리뷰에 등록한 도움돼요를 취소한다.
   *
   * @summary 리뷰 추천 취소
   * @param reviewId 추천을 취소할 리뷰 ID
   */
  @Delete("{reviewId}/like")
  @SuccessResponse(200, "리뷰 추천 취소 성공")
  public async removeLike(@Path() reviewId: number, @Request() request: any) {
    const { userId } = request as AuthenticatedRequest;
    const data = await reviewService.removeLike(userId, reviewId);

    setSuccessMessage(this, "리뷰 추천을 취소했습니다.");
    return data;
  }
}
