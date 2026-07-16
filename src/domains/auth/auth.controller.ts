import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import { success } from "../../common/response.js";
import { loginRequestSchema, signupRequestSchema } from "./auth.dto.js";
import * as authService from "./auth.service.js";

@Route("auth")
@Tags("Auth")
export class AuthController extends Controller {
  /** 자체 회원가입 */
  @Post("signup")
  @SuccessResponse(201, "Created")
  public async signup(@Body() body: unknown) {
    const dto = signupRequestSchema.parse(body);
    const user = await authService.register(dto);
    this.setStatus(201);
    return success(user);
  }

  /** 자체 로그인 */
  @Post("login")
  @SuccessResponse(200, "OK")
  public async login(@Body() body: unknown) {
    const dto = loginRequestSchema.parse(body);
    const result = await authService.login(dto);
    return success(result);
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
}
