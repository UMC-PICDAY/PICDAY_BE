import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
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
import { AppError } from "../../common/error.js";
import { setSuccessMessage } from "../../common/response.js";
import {
  parseCompleteSocialSignup,
  parseLogin,
  parseRefresh,
  parseSignup,
  parseSocialLogin,
  parseUpdateNickname,
} from "./auth.dto.js";
import * as authService from "./auth.service.js";
import { assertSocialProvider } from "./auth.social.js";
import { extractBearerToken, type SignupTokenPayload } from "./auth.token.js";

type AuthErrorResponse = {
  success: false;
  code: string;
  message: string;
  data: null;
};

// 인증 미들웨어(expressAuthentication)가 request.userId를 채워준다
type AuthenticatedRequest = { userId: bigint };
// signup 보안(Signup Token)은 userId 대신 소셜 정보를 채워준다
type AuthenticatedSignupRequest = { signupInfo: SignupTokenPayload };

@Route("auth")
@Tags("Auth")
export class AuthController extends Controller {
  /**
   * 소셜 인증 URL 생성
   *
   * provider(kakao|google)의 소셜 인증 페이지로 보낼 authorize URL을 생성한다.
   *
   * @summary 소셜 인증 URL 생성
   * @param provider 소셜 로그인 제공자 (kakao, google)
   */
  @Get("{provider}/url")
  @SuccessResponse(200, "소셜 인증 URL 생성 성공")
  @Response<AuthErrorResponse>(500, "AUTH_5021: 소셜 로그인 서버 오류")
  public async getSocialAuthUrl(@Path() provider: string) {
    const socialProvider = assertSocialProvider(provider);
    const result = authService.getSocialAuthUrl(socialProvider);
    return result;
  }

  /**
   * 소셜 로그인 (카카오·구글 구조 동일)
   *
   * 인가 코드로 소셜 프로필 조회 후 기존/신규를 판별한다.
   * 기존 유저는 토큰 발급(즉시 로그인), 신규 유저는 signupToken + socialInfo 반환.
   *
   * @summary 소셜 로그인
   * @param provider 소셜 로그인 제공자 (kakao, google)
   * @param body 소셜 로그인 인가 코드와 Redirect URI
   */
  @Post("{provider}/login")
  @SuccessResponse(200, "소셜 로그인 성공")
  @Response<AuthErrorResponse>(400, "AUTH_4001: Redirect URI 불일치")
  @Response<AuthErrorResponse>(401, "AUTH_4011: 유효하지 않은 인증 코드")
  @Response<AuthErrorResponse>(500, "AUTH_5021: 소셜 로그인 서버 오류")
  public async socialLogin(@Path() provider: string, @Body() body: unknown) {
    const socialProvider = assertSocialProvider(provider);
    const dto = parseSocialLogin(body);
    const { data, message } = await authService.socialLogin(
      socialProvider,
      dto,
    );
    setSuccessMessage(this, message);
    return data;
  }

  /**
   * 소셜 회원가입 완료 (닉네임 설정)
   *
   * Authorization: Bearer <SIGNUP_TOKEN> 필수.
   * 약관 동의를 받아 정식 회원으로 전환하고, 완료 즉시 로그인 토큰을 발급한다.
   *
   * @summary 소셜 회원가입 완료
   * @param body 동의한 약관 ID 목록
   */
  @Post("signup/complete")
  @Security("signup")
  @SuccessResponse(201, "소셜 회원가입 완료")
  @Response<AuthErrorResponse>(401, "AUTH_4013: 유효하지 않은 토큰")
  @Response<AuthErrorResponse>(401, "AUTH_4014: Signup Token 만료")
  public async completeSocialSignup(
    @Request() request: any,
    @Body() body: unknown,
  ) {
    const { signupInfo } = request as AuthenticatedSignupRequest;

    const dto = parseCompleteSocialSignup(body);
    const result = await authService.completeSocialSignup(signupInfo, dto);
    this.setStatus(201);
    setSuccessMessage(this, "회원가입이 완료되었습니다.");
    return result;
  }

  /**
   * 자체 회원가입
   *
   * 아이디와 비밀번호, 회원 정보, 약관 동의 내역을 받아 자체 회원을 생성한다.
   *
   * @summary 자체 회원가입
   * @param body 회원가입 정보
   */
  @Post("signup")
  @SuccessResponse(201, "자체 회원가입 성공")
  public async signup(@Body() body: unknown) {
    const dto = parseSignup(body);
    const user = await authService.register(dto);
    this.setStatus(201);
    return user;
  }

  /**
   * 자체 로그인
   *
   * 아이디와 비밀번호를 검증하고 Access Token과 Refresh Token을 발급한다.
   *
   * @summary 자체 로그인
   * @param body 로그인 정보
   */
  @Post("login")
  @SuccessResponse(200, "자체 로그인 성공")
  public async login(@Body() body: unknown) {
    const dto = parseLogin(body);
    const result = await authService.login(dto);
    return result;
  }

  /**
   * 토큰 갱신 (Refresh 회전)
   *
   * Authorization: Bearer <REFRESH_TOKEN> 필수.
   * body.refreshToken을 함께 보내는 경우 헤더 토큰과 일치해야 한다.
   *
   * @summary 토큰 갱신
   * @param body 헤더와 함께 검증할 Refresh Token (선택)
   */
  @Post("refresh")
  @Security("refresh")
  @SuccessResponse(200, "토큰 갱신 성공")
  public async refresh(@Request() request: any, @Body() body?: unknown) {
    const { userId } = request as AuthenticatedRequest;

    // @Security("refresh")를 통과했으므로 헤더 토큰은 반드시 존재한다
    const headerToken = extractBearerToken(request.headers?.authorization);
    if (!headerToken) {
      throw new AppError("AUTH_4013");
    }

    // body로도 보낼 수 있게 허용하되, 헤더와 다른 토큰이면 위조 시도로 간주
    const bodyToken = parseRefresh(body).refreshToken;
    if (bodyToken && bodyToken !== headerToken) {
      throw new AppError("AUTH_4013");
    }

    const result = await authService.refresh(userId, headerToken);
    setSuccessMessage(this, "토큰이 갱신되었습니다.");
    return result;
  }

  /**
   * 로그아웃
   *
   * Authorization: Bearer <ACCESS_TOKEN> 필수.
   * 서버에 저장된 Refresh Token을 무효화(null)하여 세션을 종료한다.
   *
   * @summary 로그아웃
   */
  @Security("jwt")
  @Post("logout")
  @SuccessResponse(200, "로그아웃 성공")
  @Response<AuthErrorResponse>(401, "AUTH_4013: 유효하지 않은 토큰")
  public async logout(@Request() request: any) {
    const { userId } = request as AuthenticatedRequest;

    await authService.logout(userId);
    setSuccessMessage(this, "로그아웃되었습니다.");
    return null;
  }

  /**
   * 아이디 중복 확인
   *
   * 자체 회원가입에 사용할 아이디의 형식과 사용 가능 여부를 확인한다.
   *
   * @summary 아이디 중복 확인
   * @param loginId 확인할 로그인 아이디
   */
  @Get("loginid/check")
  @SuccessResponse(200, "아이디 중복 확인 성공")
  public async checkLoginId(@Query() loginId?: string) {
    const result = await authService.checkLoginIdAvailability(loginId ?? "");
    return result;
  }

  /**
   * 닉네임 중복 확인
   *
   * 닉네임의 형식과 사용 가능 여부를 확인한다.
   *
   * @summary 닉네임 중복 확인
   * @param nickname 확인할 닉네임
   */
  @Get("nickname/check")
  @SuccessResponse(200, "닉네임 중복 확인 성공")
  public async checkNickname(@Query() nickname?: string) {
    const result = await authService.checkNicknameAvailability(nickname ?? "");
    return result;
  }

  /**
   * 내 정보 조회
   *
   * 로그인한 사용자의 기본 프로필 정보를 조회한다.
   *
   * @summary 내 정보 조회
   */
  @Security("jwt")
  @Get("me")
  @SuccessResponse(200, "내 정보 조회 성공")
  public async getMe(@Request() request: any) {
    const { userId } = request as AuthenticatedRequest;

    const result = await authService.getMe(userId);
    return result;
  }

  /**
   * 내 닉네임 수정
   *
   * 로그인한 사용자의 닉네임을 수정한다.
   *
   * @summary 내 닉네임 수정
   * @param body 수정할 닉네임
   */
  @Security("jwt")
  @Patch("me")
  @SuccessResponse(200, "내 닉네임 수정 성공")
  public async updateMe(@Request() request: any, @Body() body: unknown) {
    const { userId } = request as AuthenticatedRequest;

    const dto = parseUpdateNickname(body);
    const result = await authService.updateNickname(userId, dto);
    return result;
  }

  /**
   * 회원 탈퇴
   *
   * 로그인한 사용자를 탈퇴 처리하고 보유한 토큰을 무효화한다.
   *
   * @summary 회원 탈퇴
   */
  @Security("jwt")
  @Delete("me")
  @SuccessResponse(200, "회원 탈퇴 성공")
  public async withdraw(@Request() request: any) {
    const { userId } = request as AuthenticatedRequest;

    await authService.withdraw(userId);
    return null;
  }
}
