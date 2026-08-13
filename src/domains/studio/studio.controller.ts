import {
  Controller,
  Get,
  Middlewares,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import type { Request as ExpressRequest } from "express";
import { setSuccessMessage } from "../../common/response.js";
import type { OptionalAuthenticatedUser } from "../../server/authentication.js";
import type {
  StudioDetailResponseDto,
  StudioHairMakeupResponseDto,
  StudioSlotsResponseDto,
  StudioProductDetailResponseDto,
  StudioProductsResponseDto,
} from "./studio.detail.dto.js";
import type {
  GetHomeResponseDto,
  RecentStudioViewResponseDto,
  StudioSearchResponseDto,
  StudioAutocompleteResponseDto,
} from "./studio.search.dto.js";
import type {
  StudioComparePurposesResponseDto,
  StudioCompareResultResponseDto,
} from "./studio.compare.dto.js";

import * as studioDetailService from "./studio.detail.service.js";
import * as studioSearchService from "./studio.search.service.js";
import * as studioCompareService from "./studio.compare.service.js";
import {
  validateStudioId,
  validateStudioProductDetailRequestIds,
  validateStudioProductsRequestIds,
  validateStudioIdFormat,
  validateStudioCompareRequestIds,
} from "./studio.middleware.js";

type AppErrorResponse = {
  success: false;
  code: string;
  message: string;
  data: null;
};

// 인증 미들웨어(expressAuthentication)가 request.userId를 채워준다 (@Security("jwt") 붙은 라우트 전용)
type AuthenticatedRequest = { userId: bigint };
type OptionalAuthenticatedRequest = ExpressRequest & OptionalAuthenticatedUser;

// responseWrapper 적용 후 raw data DTO를 반환하므로 더 이상 사용하지 않음.
// type GetStudioProductsSuccessResponseDto = {
//   success: true;
//   code: "COMMON_200";
//   message: "사진관 컨셉 목록 조회에 성공했습니다.";
//   data: StudioProductsResponseDto;
// };

// type GetStudioAutocompleteSuccessResponseDto = {
//   success: true;
//   code: "STUDIO_200";
//   message: "사진관 자동완성 조회에 성공했습니다.";
//   data: StudioAutocompleteResponseDto;
// };

// === api/v1/home ===
@Route("home")
@Tags("Home")
export class HomeController extends Controller {
  /**
   * 홈 화면 조회
   *
   * 사용자의 로그인 여부와 현재 위치를 기준으로 홈 화면에 필요한 사진관 정보를 조회한다.
   *
   * @summary 홈 화면 조회
   * @param latitude 현재 위치의 위도
   * @param longitude 현재 위치의 경도
   */
  @Get()
  @SuccessResponse(200, "홈 화면 조회 성공")
  public async getHome(
    @Request() request: any,
    @Query() latitude?: number,
    @Query() longitude?: number,
  ): Promise<GetHomeResponseDto> {
    const data = await studioSearchService.getHome(
      request.headers.authorization,
      latitude,
      longitude,
    );

    setSuccessMessage(this, "홈 화면 조회에 성공했습니다.");
    return data;
  }
}

// === api/v1/studio ===
@Route("studios")
@Tags("Studio")
export class StudioController extends Controller {
  /**
   * 사진관 통합 검색
   *
   * locationCategory, date, shootingCategory 중 최소 1개는 있어야 한다.
   * Authorization 헤더는 선택이며, 없으면 비로그인 사용자로 처리해 isWishlisted를 false로 반환한다.
   *
   * @summary 사진관 통합 검색
   * @param locationCategory 지역 카테고리
   * @param date 촬영 날짜 (YYYY-MM-DD)
   * @param shootingCategory 촬영 카테고리 목록
   * @param sort 정렬 기준
   * @param minPrice 최소 가격
   * @param maxPrice 최대 가격
   * @param serviceCode 서비스 코드 목록
   * @param minRating 최소 평점
   */
  @Get("search")
  @SuccessResponse(200, "사진관 검색 결과 조회 성공")
  @Response<AppErrorResponse>(
    400,
    "STUDIO_40012: 검색 조건은 location, date, concept 중 최소 1개 이상 필요합니다.\nSTUDIO_4008: 올바르지 않은 지역입니다.\nSTUDIO_4004: 날짜 형식이 올바르지 않습니다.\nSTUDIO_40010: 과거 날짜는 검색할 수 없습니다.\nSTUDIO_4007: 올바르지 않은 촬영 컨셉입니다.\nSTUDIO_4009: 올바르지 않은 서비스 태그입니다.\nSTUDIO_40014: 올바르지 않은 정렬 기준입니다.\nSTUDIO_4003: 잘못된 필터 조건입니다.",
  )
  public async searchStudios(
    @Request() request: any,
    @Query() locationCategory?: string,
    @Query() date?: string,
    @Query() shootingCategory?: string[],
    @Query() sort?: string,
    @Query() minPrice?: number,
    @Query() maxPrice?: number,
    @Query() serviceCode?: string[],
    @Query() minRating?: number,
  ): Promise<StudioSearchResponseDto> {
    const data = await studioSearchService.searchStudios(
      request.headers.authorization,
      {
        locationCategory,
        date,
        shootingCategory,
        sort,
        minPrice,
        maxPrice,
        serviceCode,
        minRating,
      },
    );

    setSuccessMessage(
      this,
      data.hasResult
        ? "사진관 검색 결과 조회에 성공했습니다."
        : "조건에 맞는 사진관이 없습니다.",
    );
    return data;
  }

  /**
   * 사진관 이름 검색
   *
   * 이름 검색 자동완성 목록에서 사용자가 특정 사진관을 선택했을 때 호출한다.
   * Authorization 헤더는 선택이며, 없으면 비로그인 사용자로 처리해 isWishlisted를 false로 반환한다.
   *
   * @summary 사진관 이름 검색
   * @param studioId 자동완성에서 선택한 사진관 ID
   * @param sort 정렬 기준
   * @param minPrice 최소 가격
   * @param maxPrice 최대 가격
   * @param serviceCode 서비스 코드 목록
   * @param minRating 최소 평점
   */
  @Middlewares(validateStudioIdFormat)
  @Get("search/name")
  @SuccessResponse(200, "사진관 검색 결과 조회 성공")
  @Response<AppErrorResponse>(
    400,
    "STUDIO_40011: 올바르지 않은 사진관 ID입니다.\nSTUDIO_4009: 올바르지 않은 서비스 태그입니다.\nSTUDIO_40014: 올바르지 않은 정렬 기준입니다.\nSTUDIO_4003: 잘못된 필터 조건입니다.",
  )
  @Response<AppErrorResponse>(404, "STUDIO_4041: 존재하지 않는 사진관입니다.")
  public async searchStudiosByName(
    @Request() request: any,
    @Query() studioId?: number,
    @Query() sort?: string,
    @Query() minPrice?: number,
    @Query() maxPrice?: number,
    @Query() serviceCode?: string[],
    @Query() minRating?: number,
  ): Promise<StudioSearchResponseDto> {
    const data = await studioSearchService.searchStudiosByName(
      request.headers.authorization,
      { studioId, sort, minPrice, maxPrice, serviceCode, minRating },
    );

    setSuccessMessage(
      this,
      data.hasResult
        ? "사진관 검색 결과 조회에 성공했습니다."
        : "조건에 맞는 사진관이 없습니다.",
    );
    return data;
  }

  /**
   * 사진관 이름 자동완성
   *
   * 입력한 키워드로 사진관 이름을 검색해 자동완성 후보를 반환한다.
   *
   * @summary 사진관 이름 자동완성
   * @param keyword 검색할 사진관 이름 키워드
   */
  // {studioId}보다 반드시 먼저 선언해야 한다. tsoa는 메서드 선언 순서 그대로 Express 라우트를
  // 생성하고, Express는 등록 순서대로 매칭하므로 뒤에 있으면 "autocomplete"이 {studioId}로 잡혀버린다.
  @Get("autocomplete")
  @SuccessResponse(200, "사진관 자동완성 조회 성공")
  public async getStudioAutocomplete(
    @Query() keyword: string,
  ): Promise<StudioAutocompleteResponseDto> {
    const data = await studioSearchService.getStudioAutocomplete(keyword);

    setSuccessMessage(this, "사진관 자동완성 조회에 성공했습니다.");
    return data;
  }

  /**
   * 사진관 상세 정보 조회
   *
   * 사진관의 기본 정보, 이미지, 서비스, 평점 등 상세 정보를 조회한다.
   * Access Token은 선택이며, 로그인한 경우 위시리스트 여부를 함께 반환한다.
   *
   * @summary 사진관 상세 정보 조회
   * @param studioId 조회할 사진관 ID
   * @isLong studioId 사진관 ID는 정수여야 합니다.
   * @minimum studioId 1 사진관 ID는 양수여야 합니다.
   * @maximum studioId 9007199254740991 사진관 ID가 허용 범위를 초과했습니다.
   */
  @Middlewares(validateStudioId)
  @Security("optionalJwt")
  @Get("{studioId}")
  @SuccessResponse(200, "사진관 상세 정보 조회 성공")
  @Response<AppErrorResponse>(400, "STUDIO_4001: 잘못된 요청")
  @Response<AppErrorResponse>(404, "STUDIO_4041: 사진관을 찾을 수 없음")
  @Response<AppErrorResponse>(500, "COMMON_500: 서버 오류")
  public async getStudioDetail(
    @Path() studioId: number,
    @Request() request: OptionalAuthenticatedRequest,
  ): Promise<StudioDetailResponseDto> {
    const data = await studioDetailService.getStudioDetail(
      studioId,
      request.userId,
    );

    setSuccessMessage(this, "사진관 상세 정보 조회에 성공했습니다.");
    return data;
  }

  /**
   * 최근 본 사진관 저장
   *
   * 사진관 상세 페이지 진입 시 호출한다. 로그인한 사용자만 호출 가능(Access Token 필수),
   * 이미 조회한 사진관이면 viewedAt만 최신 시간으로 갱신한다.
   *
   * @summary 최근 본 사진관 저장
   * @param studioId 저장할 사진관 ID
   * @isLong studioId 사진관 ID는 정수여야 합니다.
   * @minimum studioId 1 사진관 ID는 양수여야 합니다.
   * @maximum studioId 9007199254740991 사진관 ID가 허용 범위를 초과했습니다.
   */
  @Middlewares(validateStudioIdFormat)
  @Security("jwt")
  @Post("{studioId}/recent-view")
  @SuccessResponse(200, "최근 본 사진관 저장 성공")
  @Response<AppErrorResponse>(
    400,
    "STUDIO_40011: 올바르지 않은 사진관 ID입니다.",
  )
  @Response<AppErrorResponse>(
    401,
    "AUTH_4013: 유효하지 않은 토큰입니다.\nAUTH_4017: 만료된 토큰입니다.",
  )
  @Response<AppErrorResponse>(404, "STUDIO_4041: 존재하지 않는 사진관입니다.")
  @Response<AppErrorResponse>(500, "COMMON_500: 서버 내부 오류가 발생했습니다.")
  public async saveRecentStudioView(
    @Path() studioId: number,
    @Request() request: any,
  ): Promise<RecentStudioViewResponseDto> {
    const { userId } = request as AuthenticatedRequest;
    const data = await studioSearchService.saveRecentStudioView(
      userId,
      studioId,
    );

    setSuccessMessage(this, "최근 본 사진관 저장에 성공했습니다.");
    return data;
  }

  /**
   * 헤어메이크업 연계 정보 조회
   *
   * 지정한 사진관의 헤어메이크업 연계 정보를 조회한다.
   *
   * @summary 헤어메이크업 연계 정보 조회
   * @param studioId 조회할 사진관 ID
   * @isLong studioId 사진관 ID는 정수여야 합니다.
   * @minimum studioId 1 사진관 ID는 양수여야 합니다.
   * @maximum studioId 9007199254740991 사진관 ID가 허용 범위를 초과했습니다.
   */
  @Middlewares(validateStudioId)
  @Get("{studioId}/hair-makeup")
  @SuccessResponse(200, "헤어메이크업 연계 정보 조회 성공")
  @Response<AppErrorResponse>(
    "400",
    "STUDIO_4001: 사진관 API 요청 형식 또는 입력값이 올바르지 않습니다.",
  )
  @Response<AppErrorResponse>("404", "STUDIO_4041: 존재하지 않는 사진관입니다.")
  @Response<AppErrorResponse>("500", "COMMON_500: 서버 오류가 발생했습니다.")
  public async getStudioHairMakeup(
    @Path() studioId: number,
  ): Promise<StudioHairMakeupResponseDto> {
    const data = await studioDetailService.getStudioHairMakeup(studioId);

    setSuccessMessage(
      this,
      "사진관 헤어메이크업 연계 정보 조회에 성공했습니다.",
    );
    return data;
  }

  /**
   * 예약 가능 시간 조회
   *
   * 지정한 날짜에 예약할 수 있는 사진관의 시간대를 조회한다.
   *
   * @summary 예약 가능 시간 조회
   * @param studioId 조회할 사진관 ID
   * @param date 조회할 날짜 (YYYY-MM-DD)
   * @isLong studioId 사진관 ID는 정수여야 합니다.
   * @minimum studioId 1 사진관 ID는 양수여야 합니다.
   * @maximum studioId 9007199254740991 사진관 ID가 허용 범위를 초과했습니다.
   */
  @Middlewares(validateStudioId)
  @Get("{studioId}/slots")
  @SuccessResponse(200, "예약 가능 시간 조회 성공")
  public async getStudioSlots(
    @Path() studioId: number,
    @Query() date?: string,
  ): Promise<StudioSlotsResponseDto> {
    const data = await studioDetailService.getStudioSlots(studioId, date);

    setSuccessMessage(this, "예약 가능 시간 조회에 성공했습니다.");
    return data;
  }

  /**
   * 사진관 상품 목록 조회
   *
   * 지정한 사진관의 촬영 상품을 컨셉별로 조회한다.
   * 시간 슬롯 ID를 전달하면 해당 시간에 예약 가능한 상품을 조회한다.
   *
   * @summary 사진관 상품 목록 조회
   * @param studioId 조회할 사진관 ID
   * @param timeSlotId 예약 시간 슬롯 ID
   * @isLong studioId 사진관 ID는 정수여야 합니다.
   * @minimum studioId 1 사진관 ID는 양수여야 합니다.
   * @maximum studioId 9007199254740991 사진관 ID가 허용 범위를 초과했습니다.
   * @isLong timeSlotId 시간 슬롯 ID는 정수여야 합니다.
   * @minimum timeSlotId 1 시간 슬롯 ID는 양수여야 합니다.
   * @maximum timeSlotId 9007199254740991 시간 슬롯 ID가 허용 범위를 초과했습니다.
   */
  @Middlewares(validateStudioProductsRequestIds)
  @Get("{studioId}/products")
  @SuccessResponse(200, "사진관 상품 목록 조회 성공")
  @Response<AppErrorResponse>(400, "잘못된 요청")
  @Response<AppErrorResponse>(404, "대상을 찾을 수 없음")
  @Response<AppErrorResponse>(500, "서버 오류")
  public async getStudioProducts(
    @Path() studioId: number,
    @Query() timeSlotId?: number,
  ): Promise<StudioProductsResponseDto> {
    const data = await studioDetailService.getStudioProducts(
      studioId,
      timeSlotId,
    );

    setSuccessMessage(this, "사진관 컨셉 목록 조회에 성공했습니다.");
    return data;
  }

  /**
   * 사진관 상품 상세 조회
   *
   * 지정한 사진관의 촬영 상품 정보와 상세 이미지를 조회한다.
   *
   * @summary 사진관 상품 상세 조회
   * @param studioId 조회할 사진관 ID
   * @param studioProductId 조회할 상품 ID
   * @isLong studioId 사진관 ID는 정수여야 합니다.
   * @minimum studioId 1 사진관 ID는 양수여야 합니다.
   * @maximum studioId 9007199254740991 사진관 ID가 허용 범위를 초과했습니다.
   * @isLong studioProductId 상품 ID는 정수여야 합니다.
   * @minimum studioProductId 1 상품 ID는 양수여야 합니다.
   * @maximum studioProductId 9007199254740991 상품 ID가 허용 범위를 초과했습니다.
   */
  @Middlewares(validateStudioProductDetailRequestIds)
  @Get("{studioId}/products/{studioProductId}")
  @SuccessResponse(200, "사진관 상품 상세 조회 성공")
  @Response<AppErrorResponse>(400, "잘못된 요청")
  @Response<AppErrorResponse>(404, "대상을 찾을 수 없음")
  @Response<AppErrorResponse>(500, "서버 오류")
  public async getStudioProductDetail(
    @Path() studioId: number,
    @Path() studioProductId: number,
  ): Promise<StudioProductDetailResponseDto> {
    const data = await studioDetailService.getStudioProductDetail(
      studioId,
      studioProductId,
    );

    setSuccessMessage(this, "사진관 컨셉 사진 조회에 성공했습니다.");
    return data;
  }

  /**
   * 사진관 비교 목적 조회
   *
   * 비교할 2~3개 사진관이 공통으로 지원하는 촬영 목적을 조회한다.
   *
   * @summary 사진관 비교 목적 조회
   * @param studioIds 비교할 사진관 ID 목록 (2~3개)
   */
  @Middlewares(validateStudioCompareRequestIds)
  @Get("compare/purposes")
  @SuccessResponse(200, "사진관 비교 목적 조회 성공")
  @Response<AppErrorResponse>(
    400,
    "STUDIO_40011: 올바르지 않은 사진관 ID / STUDIO_40013: 비교 대상 개수(2~3개) 또는 중복 오류",
  )
  @Response<AppErrorResponse>(404, "STUDIO_4041: 존재하지 않는 사진관이 포함됨")
  @Response<AppErrorResponse>(500, "COMMON_500: 서버 오류")
  public async getStudioComparePurposes(
    @Query() studioIds: string[],
  ): Promise<StudioComparePurposesResponseDto> {
    const data = await studioCompareService.getStudioComparePurposes(studioIds);

    setSuccessMessage(this, "비교 목적 조회에 성공했습니다.");
    return data;
  }
  /**
   * 사진관 비교 결과 조회
   *
   * 선택한 2~3개 사진관의 가격, 평점, 서비스 등 비교 정보를 조회한다.
   * 촬영 카테고리를 전달하면 해당 목적의 상품을 기준으로 비교한다.
   *
   * @summary 사진관 비교 결과 조회
   * @param studioIds 비교할 사진관 ID 목록 (2~3개)
   * @param shootingCategory 비교할 촬영 카테고리
   */
  @Middlewares(validateStudioCompareRequestIds)
  @Get("compare/result")
  @SuccessResponse(200, "사진관 비교 결과 조회 성공")
  @Response<AppErrorResponse>(
    400,
    "STUDIO_40011: 올바르지 않은 사진관 ID / STUDIO_40013: 비교 대상 개수(2~3개) 또는 중복 오류 / STUDIO_4007: 잘못된 촬영 목적",
  )
  @Response<AppErrorResponse>(
    404,
    "STUDIO_4041: 존재하지 않는 사진관 / STUDIO_4046: 선택 촬영 목적을 지원하지 않는 사진관 포함",
  )
  @Response<AppErrorResponse>(500, "COMMON_500: 서버 오류")
  public async getStudioCompareResult(
    @Query() studioIds: string[],
    @Query() shootingCategory?: string,
  ): Promise<StudioCompareResultResponseDto> {
    const data = await studioCompareService.getStudioCompareResult(
      studioIds,
      shootingCategory,
    );

    setSuccessMessage(this, "비교 결과 조회에 성공했습니다.");
    return data;
  }
}
