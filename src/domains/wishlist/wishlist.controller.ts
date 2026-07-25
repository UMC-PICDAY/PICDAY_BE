import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import type {
  AddWishlistRequestDto,
  AddWishlistSuccessResponseDto,
  DeleteWishlistSuccessResponseDto,
  GetWishlistsSuccessResponseDto,
} from "./wishlist.dto.js";
import * as wishlistService from "./wishlist.service.js";

// 인증 미들웨어(expressAuthentication)가 request.userId를 채워준다
type AuthenticatedRequest = { userId: bigint };

@Route("wishlists")
@Tags("Wishlist")
@Security("jwt")
export class WishlistController extends Controller {
  /** 위시리스트 목록 조회 */
  @Get()
  @SuccessResponse(200, "OK")
  public async list(
    @Request() request: any,
    @Query() page?: number,
    @Query() size?: number,
  ): Promise<GetWishlistsSuccessResponseDto> {
    const { userId } = request as AuthenticatedRequest;
    const data = await wishlistService.getWishlists(userId, {
      ...(page !== undefined && { page }),
      ...(size !== undefined && { size }),
    });

    return {
      success: true,
      code: "COMMON_200",
      message: "위시리스트 조회에 성공했습니다.",
      data,
    };
  }

  /** 위시리스트 추가 */
  @Post()
  @SuccessResponse(201, "Created")
  public async add(
    @Body() body: AddWishlistRequestDto,
    @Request() request: any,
  ): Promise<AddWishlistSuccessResponseDto> {
    const { userId } = request as AuthenticatedRequest;
    const data = await wishlistService.addWishlist(userId, body);

    this.setStatus(201);
    return {
      success: true,
      code: "COMMON_201",
      message: "위시리스트에 추가되었습니다.",
      data,
    };
  }

  /** 위시리스트 삭제 */
  @Delete("{studioId}")
  @SuccessResponse(200, "OK")
  public async remove(
    @Path() studioId: number,
    @Request() request: any,
  ): Promise<DeleteWishlistSuccessResponseDto> {
    const { userId } = request as AuthenticatedRequest;
    const data = await wishlistService.removeWishlist(userId, studioId);

    return {
      success: true,
      code: "COMMON_200",
      message: "위시리스트에서 삭제되었습니다.",
      data,
    };
  }
}
