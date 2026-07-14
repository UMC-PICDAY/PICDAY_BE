import { Body, Controller, Post, Route, SuccessResponse, Tags } from "tsoa";
import { success } from "../../common/response.js";
import { signupRequestSchema } from "./auth.dto.js";
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
}
