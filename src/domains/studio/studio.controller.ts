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
  SearchStudiosSuccessResponseDto,
  SaveRecentStudioViewSuccessResponseDto,
} from "./studio.search.dto.js";
import * as studioDetailService from "./studio.detail.service.js";
import * as studioSearchService from "./studio.search.service.js";
import {
  validateStudioId,
  validateStudioProductDetailRequestIds,
  validateStudioProductsRequestIds,
  validateRecentStudioViewRequestId,
} from "./studio.middleware.js";

type AppErrorResponse = {
  success: false;
  code: string;
  message: string;
  data: null;
};

// 인증 미들웨어(expressAuthentication)가 request.userId를 채워준다 (@Security("jwt") 붙은 라우트 전용)
type AuthenticatedRequest = { userId: bigint };

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
   * 사진관 검색 결과 조회 API (통합 검색: 위치/날짜/컨셉)
   *
   * locationCategory, date, shootingCategory 중 최소 1개는 있어야 한다.
   * Authorization 헤더는 선택이며, 없으면 비로그인 사용자로 처리해 isWishlisted를 false로 반환한다.
   */
  @Get("search")
  @SuccessResponse(200, "OK")
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
  ): Promise<SearchStudiosSuccessResponseDto> {
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

    return {
      success: true,
      code: "STUDIO_200",
      message: "사진관 검색 결과 조회에 성공했습니다.",
      data,
    };
  }

  /**
   * 사진관 검색 결과 조회 API (스튜디오 이름 검색)
   *
   * Authorization 헤더는 선택이며, 없으면 비로그인 사용자로 처리해 isWishlisted를 false로 반환한다.
   */
  @Get("search/name")
  @SuccessResponse(200, "OK")
  @Response<AppErrorResponse>(
    400,
    "STUDIO_40016: 스튜디오 이름 검색어가 올바르지 않습니다.\nSTUDIO_4009: 올바르지 않은 서비스 태그입니다.\nSTUDIO_40014: 올바르지 않은 정렬 기준입니다.\nSTUDIO_4003: 잘못된 필터 조건입니다.",
  )
  public async searchStudiosByName(
    @Request() request: any,
    @Query() studioName?: string,
    @Query() sort?: string,
    @Query() minPrice?: number,
    @Query() maxPrice?: number,
    @Query() serviceCode?: string[],
    @Query() minRating?: number,
  ): Promise<SearchStudiosSuccessResponseDto> {
    const data = await studioSearchService.searchStudiosByName(
      request.headers.authorization,
      { studioName, sort, minPrice, maxPrice, serviceCode, minRating },
    );

    return {
      success: true,
      code: "STUDIO_200",
      message: "사진관 검색 결과 조회에 성공했습니다.",
      data,
    };
  }

  // === 사진관 자동완성 검색 API ===
  // {studioId}보다 반드시 먼저 선언해야 한다. tsoa는 메서드 선언 순서 그대로 Express 라우트를
  // 생성하고, Express는 등록 순서대로 매칭하므로 뒤에 있으면 "autocomplete"이 {studioId}로 잡혀버린다.
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
   * 최근 본 사진관 저장 API
   *
   * 사진관 상세 페이지 진입 시 호출한다. 로그인한 사용자만 호출 가능(Access Token 필수),
   * 이미 조회한 사진관이면 viewedAt만 최신 시간으로 갱신한다.
   *
   * @isLong studioId 사진관 ID는 정수여야 합니다.
   * @minimum studioId 1 사진관 ID는 양수여야 합니다.
   * @maximum studioId 9007199254740991 사진관 ID가 허용 범위를 초과했습니다.
   */
  @Middlewares(validateRecentStudioViewRequestId)
  @Security("jwt")
  @Post("{studioId}/recent-view")
  @SuccessResponse(200, "OK")
  @Response<AppErrorResponse>(400, "STUDIO_40011: 올바르지 않은 사진관 ID입니다.")
  @Response<AppErrorResponse>(
    401,
    "AUTH_4013: 유효하지 않은 토큰입니다.\nAUTH_4017: 만료된 토큰입니다.",
  )
  @Response<AppErrorResponse>(404, "STUDIO_4041: 존재하지 않는 사진관입니다.")
  @Response<AppErrorResponse>(500, "COMMON_500: 서버 내부 오류가 발생했습니다.")
  public async saveRecentStudioView(
    @Path() studioId: number,
    @Request() request: any,
  ): Promise<SaveRecentStudioViewSuccessResponseDto> {
    const { userId } = request as AuthenticatedRequest;
    const data = await studioSearchService.saveRecentStudioView(
      userId,
      studioId,
    );

    return {
      success: true,
      code: "STUDIO_200",
      message: "최근 본 사진관 저장에 성공했습니다.",
      data,
    };
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
}
