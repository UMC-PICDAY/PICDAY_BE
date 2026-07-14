import {
  Controller,
  Get,
  Path,
  Query,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import type { GetStudioSlotsSuccessResponseDto } from "./studio.dto.js";
import * as studioService from "./studio.service.js";

// === 예약 가능 시간 조회 API ===
@Route("studios")
@Tags("Studio")
export class StudioController extends Controller {
  @Get("{studioId}/slots")
  @SuccessResponse(200, "OK")
  public async getStudioSlots(
    @Path() studioId: string,
    @Query() date?: string,
  ): Promise<GetStudioSlotsSuccessResponseDto> {
    const data = await studioService.getStudioSlots(studioId, date);

    return {
      success: true,
      code: "COMMON_200",
      message: "예약 가능 시간 조회에 성공했습니다.",
      data,
    };
  }
}
