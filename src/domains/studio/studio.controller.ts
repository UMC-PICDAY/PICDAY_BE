import {
  Controller,
  Get,
  Middlewares,
  Path,
  Query,
  Request,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import { success, type ApiResponse } from "../../common/response.js";
import type {
  GetStudioSlotsSuccessResponseDto,
  StudioDetailResponseDto,
  StudioHairMakeupResponseDto,
  StudioProductDetailResponseDto,
  StudioProductsResponseDto,
} from "./studio.detail.dto.js";
import type {
  GetHomeResponseDto,
  StudioAutocompleteResponseDto,
} from "./studio.search.dto.js";
import type { StudioComparePurposesResponseDto } from "./studio.compare.dto.js";

import * as studioDetailService from "./studio.detail.service.js";
import * as studioSearchService from "./studio.search.service.js";
import * as studioCompareService from "./studio.compare.service.js"
import {
  validateStudioId,
  validateStudioProductDetailRequestIds,
  validateStudioProductsRequestIds,
  validateStudioCompareRequestIds
} from "./studio.middleware.js";

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

// === api/v1/home ===
@Route("home")
@Tags("Home")
export class HomeController extends Controller {
  @Get()
  @SuccessResponse(200, "OK")
  public async getHome(
    @Request() request: any,
    @Query() latitude?: number,
    @Query() longitude?: number,
  ): Promise<GetHomeResponseDto> {
    return studioSearchService.getHome(
      request.headers.authorization,
      latitude,
      longitude,
    );
  }
}

// === api/v1/studio ===
@Route("studios")
@Tags("Studio")
export class StudioController extends Controller {
  /**
   * 사진관 상세 정보 조회 API
   *
   * @isLong studioId 사진관 ID는 정수여야 합니다.
   * @minimum studioId 1 사진관 ID는 양수여야 합니다.
   * @maximum studioId 9007199254740991 사진관 ID가 허용 범위를 초과했습니다.
   */
  @Middlewares(validateStudioId)
  @Get("{studioId}")
  @SuccessResponse(200, "OK")
  @Response<AppErrorResponse>(400, "STUDIO_4001: 잘못된 요청")
  @Response<AppErrorResponse>(404, "STUDIO_4041: 사진관을 찾을 수 없음")
  @Response<AppErrorResponse>(500, "COMMON_500: 서버 오류")
  public async getStudioDetail(
    @Path() studioId: number,
  ): Promise<ApiResponse<StudioDetailResponseDto>> {
    const data = await studioDetailService.getStudioDetail(studioId);

    return success(data, "사진관 상세 정보 조회에 성공했습니다.");
  }

  /**
   * 헤어메이크업 연계 상세 조회 API
   *
   * @isLong studioId 사진관 ID는 정수여야 합니다.
   * @minimum studioId 1 사진관 ID는 양수여야 합니다.
   * @maximum studioId 9007199254740991 사진관 ID가 허용 범위를 초과했습니다.
   */
  @Middlewares(validateStudioId)
  @Get("{studioId}/hair-makeup")
  @SuccessResponse("200", "사진관 헤어메이크업 연계 정보 조회 성공")
  @Response<AppErrorResponse>(
    "400",
    "STUDIO_4001: 사진관 API 요청 형식 또는 입력값이 올바르지 않습니다.",
  )
  @Response<AppErrorResponse>("404", "STUDIO_4041: 존재하지 않는 사진관입니다.")
  @Response<AppErrorResponse>("500", "COMMON_500: 서버 오류가 발생했습니다.")
  public async getStudioHairMakeup(
    @Path() studioId: number,
  ): Promise<ApiResponse<StudioHairMakeupResponseDto>> {
    const data = await studioDetailService.getStudioHairMakeup(studioId);

    return success(data, "사진관 헤어메이크업 연계 정보 조회에 성공했습니다.");
  }

  /**
   * 예약 가능 시간 조회 API
   *
   * @isLong studioId 사진관 ID는 정수여야 합니다.
   * @minimum studioId 1 사진관 ID는 양수여야 합니다.
   * @maximum studioId 9007199254740991 사진관 ID가 허용 범위를 초과했습니다.
   */
  @Middlewares(validateStudioId)
  @Get("{studioId}/slots")
  @SuccessResponse(200, "OK")
  public async getStudioSlots(
    @Path() studioId: number,
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

  /**
   * 컨셉 목록 조회 API
   *
   * @isLong studioId 사진관 ID는 정수여야 합니다.
   * @minimum studioId 1 사진관 ID는 양수여야 합니다.
   * @maximum studioId 9007199254740991 사진관 ID가 허용 범위를 초과했습니다.
   * @isLong timeSlotId 시간 슬롯 ID는 정수여야 합니다.
   * @minimum timeSlotId 1 시간 슬롯 ID는 양수여야 합니다.
   * @maximum timeSlotId 9007199254740991 시간 슬롯 ID가 허용 범위를 초과했습니다.
   */
  @Middlewares(validateStudioProductsRequestIds)
  @Get("{studioId}/products")
  @SuccessResponse(200, "OK")
  @Response<AppErrorResponse>(400, "잘못된 요청")
  @Response<AppErrorResponse>(404, "대상을 찾을 수 없음")
  @Response<AppErrorResponse>(500, "서버 오류")
  public async getStudioProducts(
    @Path() studioId: number,
    @Query() timeSlotId?: number,
  ): Promise<GetStudioProductsSuccessResponseDto> {
    const data = await studioDetailService.getStudioProducts(
      studioId,
      timeSlotId,
    );

    return {
      success: true,
      code: "COMMON_200",
      message: "사진관 컨셉 목록 조회에 성공했습니다.",
      data,
    };
  }

  /**
   * 컨셉 사진 상세 조회 API
   *
   * @isLong studioId 사진관 ID는 정수여야 합니다.
   * @minimum studioId 1 사진관 ID는 양수여야 합니다.
   * @maximum studioId 9007199254740991 사진관 ID가 허용 범위를 초과했습니다.
   * @isLong studioProductId 상품 ID는 정수여야 합니다.
   * @minimum studioProductId 1 상품 ID는 양수여야 합니다.
   * @maximum studioProductId 9007199254740991 상품 ID가 허용 범위를 초과했습니다.
   */
  @Middlewares(validateStudioProductDetailRequestIds)
  @Get("{studioId}/products/{studioProductId}")
  @SuccessResponse(200, "OK")
  @Response<AppErrorResponse>(400, "잘못된 요청")
  @Response<AppErrorResponse>(404, "대상을 찾을 수 없음")
  @Response<AppErrorResponse>(500, "서버 오류")
  public async getStudioProductDetail(
    @Path() studioId: number,
    @Path() studioProductId: number,
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

  // === 비교 목적 조회 API ===
  @Middlewares(validateStudioCompareRequestIds)
  @Get("compare/purposes")
  @SuccessResponse(200, "OK")
  @Response<AppErrorResponse>(
    400,
    "STUDIO_40011: 올바르지 않은 사진관 ID / STUDIO_40013: 비교 대상 개수(2~3개) 또는 중복 오류",
  )
  @Response<AppErrorResponse>(404, "STUDIO_4041: 존재하지 않는 사진관이 포함됨")
  @Response<AppErrorResponse>(500, "COMMON_500: 서버 오류")
  public async getStudioComparePurposes(
    @Query() studioIds: string[],
  ): Promise<ApiResponse<StudioComparePurposesResponseDto>> {
    const data =
      await studioCompareService.getStudioComparePurposes(studioIds);

    return success(data, "비교 목적 조회에 성공했습니다.");
  }
}
