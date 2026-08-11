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
  /** 리뷰 작성 */
  @Post()
  @SuccessResponse(201, "Created")
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

  /** 리뷰 단건 조회 (마이페이지 "내 리뷰", 본인 리뷰만) */
  @Get("{reviewId}")
  @SuccessResponse(200, "OK")
  public async detail(@Path() reviewId: number, @Request() request: any) {
    const { userId } = request as AuthenticatedRequest;
    const data = await reviewService.getReviewDetail(userId, reviewId);

    setSuccessMessage(this, "리뷰 조회에 성공했습니다.");
    return data;
  }

  /** 리뷰 수정 (부분 수정, imageUrls는 전체 교체) */
  @Patch("{reviewId}")
  @SuccessResponse(200, "OK")
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

  /** 리뷰 삭제 */
  @Delete("{reviewId}")
  @SuccessResponse(200, "OK")
  public async remove(@Path() reviewId: number, @Request() request: any) {
    const { userId } = request as AuthenticatedRequest;
    const data = await reviewService.removeReview(userId, reviewId);

    setSuccessMessage(this, "리뷰가 삭제되었습니다.");
    return data;
  }

  /** 리뷰 추천 (도움돼요) */
  @Post("{reviewId}/like")
  @SuccessResponse(201, "Created")
  public async addLike(@Path() reviewId: number, @Request() request: any) {
    const { userId } = request as AuthenticatedRequest;
    const data = await reviewService.addLike(userId, reviewId);

    this.setStatus(201);
    setSuccessMessage(this, "리뷰를 추천했습니다.");
    return data;
  }

  /** 리뷰 추천 취소 */
  @Delete("{reviewId}/like")
  @SuccessResponse(200, "OK")
  public async removeLike(@Path() reviewId: number, @Request() request: any) {
    const { userId } = request as AuthenticatedRequest;
    const data = await reviewService.removeLike(userId, reviewId);

    setSuccessMessage(this, "리뷰 추천을 취소했습니다.");
    return data;
  }
}
