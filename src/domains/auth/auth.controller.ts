import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import { AppError } from "../../common/error.js";
import { success } from "../../common/response.js";
import { parseLogin, parseRefresh, parseSignup, parseUpdateNickname } from "./auth.dto.js";
import * as authService from "./auth.service.js";
import { extractBearerToken } from "./auth.token.js";

// 인증 미들웨어(expressAuthentication)가 request.userId를 채워준다
type AuthenticatedRequest = { userId: bigint };

@Route("auth")
@Tags("Auth")
export class AuthController extends Controller {
  /** 자체 회원가입 */
  @Post("signup")
  @SuccessResponse(201, "Created")
  public async signup(@Body() body: unknown) {
    const dto = parseSignup(body);
    const user = await authService.register(dto);
    this.setStatus(201);
    return success(user);
  }

  /** 자체 로그인 */
  @Post("login")
  @SuccessResponse(200, "OK")
  public async login(@Body() body: unknown) {
    const dto = parseLogin(body);
    const result = await authService.login(dto);
    return success(result);
  }

  /**
   * 토큰 갱신 (Refresh 회전)
   *
   * Authorization: Bearer <REFRESH_TOKEN> 필수.
   * body.refreshToken을 함께 보내는 경우 헤더 토큰과 일치해야 한다.
   */
  @Post("refresh")
  @Security("refresh")
  @SuccessResponse(200, "OK")
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
    return success(result, "토큰이 갱신되었습니다.");
  }

  /** 아이디 중복 확인 */
  @Get("loginid/check")
  @SuccessResponse(200, "OK")
  public async checkLoginId(@Query() loginId?: string) {
    const result = await authService.checkLoginIdAvailability(loginId ?? "");
    return success(result);
  }

  /** 닉네임 중복 확인 */
  @Get("nickname/check")
  @SuccessResponse(200, "OK")
  public async checkNickname(@Query() nickname?: string) {
    const result = await authService.checkNicknameAvailability(nickname ?? "");
    return success(result);
  }

  @Security("jwt")
  @Get("me")
  @SuccessResponse(200, "OK")
  public async getMe(
    @Request() request: any
  ){
      const { userId } = request as AuthenticatedRequest;

      const result = await authService.getMe(userId);
      return success(result);
  }

  @Security("jwt")
  @Patch("me")
  @SuccessResponse(200, "OK")
  public async updateMe(
    @Request() request: any,
    @Body() body: unknown
  ){
    const { userId } = request as AuthenticatedRequest;

    const dto = parseUpdateNickname(body)
    const result = await authService.updateNickname(userId, dto);
    return success(result)
  }
}
