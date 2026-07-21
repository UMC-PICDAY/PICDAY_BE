import {
  Body,
  Controller,
  Delete,
  Patch,
  Path,
  Post,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import type {
  CreateReviewRequestDto,
  CreateReviewSuccessResponseDto,
  DeleteReviewSuccessResponseDto,
  UpdateReviewRequestDto,
  UpdateReviewSuccessResponseDto,
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
  ): Promise<CreateReviewSuccessResponseDto> {
    const { userId } = request as AuthenticatedRequest;
    const data = await reviewService.createReview(userId, body);

    this.setStatus(201);
    return {
      success: true,
      code: "COMMON_201",
      message: "리뷰가 등록되었습니다.",
      data,
    };
  }

  /** 리뷰 수정 (부분 수정, imageUrls는 전체 교체) */
  @Patch("{reviewId}")
  @SuccessResponse(200, "OK")
  public async update(
    @Path() reviewId: string,
    @Body() body: UpdateReviewRequestDto,
    @Request() request: any,
  ): Promise<UpdateReviewSuccessResponseDto> {
    const { userId } = request as AuthenticatedRequest;
    const data = await reviewService.updateReview(userId, reviewId, body);

    return {
      success: true,
      code: "COMMON_200",
      message: "리뷰가 수정되었습니다.",
      data,
    };
  }

  /** 리뷰 삭제 */
  @Delete("{reviewId}")
  @SuccessResponse(200, "OK")
  public async remove(
    @Path() reviewId: string,
    @Request() request: any,
  ): Promise<DeleteReviewSuccessResponseDto> {
    const { userId } = request as AuthenticatedRequest;
    const data = await reviewService.removeReview(userId, reviewId);

    return {
      success: true,
      code: "COMMON_200",
      message: "리뷰가 삭제되었습니다.",
      data,
    };
  }
}
