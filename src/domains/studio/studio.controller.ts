import {
  Controller,
  Get,
  Path,
  Query,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import { success, type ApiResponse } from "../../common/response.js";
import type {
  GetStudioSlotsSuccessResponseDto,
  StudioDetailResponseDto,
  StudioProductDetailResponseDto,
  StudioProductsResponseDto,
} from "./studio.detail.dto.js";
import type { StudioAutocompleteResponseDto } from "./studio.search.dto.js";
import * as studioDetailService from "./studio.detail.service.js";
import * as studioSearchService from "./studio.search.service.js";

type AppErrorResponse = {
  success: false;
  code: string;
  message: string;
  data: null;
};

type GetStudioProductsSuccessResponseDto = {
  success: true;
  code: "COMMON_200";
  message: "사진관 컨셉 목록 조회에 성공했습니다.";
  data: StudioProductsResponseDto;
};

// 사진관 자동완성 검색 API 응답
type GetStudioAutocompleteSuccessResponseDto = {
  success: true;
  code: "STUDIO_200";
  message: "사진관 자동완성 조회에 성공했습니다.";
  data: StudioAutocompleteResponseDto;
};

@Route("studios")
@Tags("Studio")
export class StudioController extends Controller {
  // === 사진관 상세 정보 조회 API ===
  @Get("{studioId}")
  @SuccessResponse(200, "OK")
  @Response<AppErrorResponse>(400, "STUDIO_4001: 잘못된 요청")
  @Response<AppErrorResponse>(404, "STUDIO_4041: 사진관을 찾을 수 없음")
  @Response<AppErrorResponse>(500, "COMMON_500: 서버 오류")
  public async getStudioDetail(
    @Path() studioId: string,
  ): Promise<ApiResponse<StudioDetailResponseDto>> {
    const data = await studioDetailService.getStudioDetail(studioId);

    return success(data, "사진관 상세 정보 조회에 성공했습니다.");
  }

  // === 예약 가능 시간 조회 API ===
  @Get("{studioId}/slots")
  @SuccessResponse(200, "OK")
  public async getStudioSlots(
    @Path() studioId: string,
    @Query() date?: string,
  ): Promise<GetStudioSlotsSuccessResponseDto> {
    const data = await studioDetailService.getStudioSlots(studioId, date);

    return {
      success: true,
      code: "COMMON_200",
      message: "예약 가능 시간 조회에 성공했습니다.",
      data,
    };
  }

  // === 컨셉 목록 조회 API ===
  @Get("{studioId}/products")
  @SuccessResponse(200, "OK")
  @Response<AppErrorResponse>(400, "잘못된 요청")
  @Response<AppErrorResponse>(404, "대상을 찾을 수 없음")
  @Response<AppErrorResponse>(500, "서버 오류")
  public async getStudioProducts(
    @Path() studioId: string,
    @Query() timeSlotId?: string,
  ): Promise<GetStudioProductsSuccessResponseDto> {
    const data = await studioDetailService.getStudioProducts(studioId, timeSlotId);

    return {
      success: true,
      code: "COMMON_200",
      message: "사진관 컨셉 목록 조회에 성공했습니다.",
      data,
    };
  }

  // === 컨셉 사진 상세 조회 API ===
  @Get("{studioId}/products/{studioProductId}")
  @SuccessResponse(200, "OK")
  @Response<AppErrorResponse>(400, "잘못된 요청")
  @Response<AppErrorResponse>(404, "대상을 찾을 수 없음")
  @Response<AppErrorResponse>(500, "서버 오류")
  public async getStudioProductDetail(
    @Path() studioId: string,
    @Path() studioProductId: string,
  ): Promise<ApiResponse<StudioProductDetailResponseDto>> {
    const data = await studioDetailService.getStudioProductDetail(
      studioId,
      studioProductId,
    );

    return success(data, "사진관 컨셉 사진 조회에 성공했습니다.");
  }

  // === 사진관 자동완성 검색 API ===
  @Get("autocomplete")
  @SuccessResponse(200, "OK")
  public async getStudioAutocomplete(
    @Query() keyword: string,
  ): Promise<GetStudioAutocompleteSuccessResponseDto> {
    const data = await studioSearchService.getStudioAutocomplete(keyword);

    return {
      success: true,
      code: "STUDIO_200",
      message: "사진관 자동완성 조회에 성공했습니다.",
      data,
    };
  }
}
