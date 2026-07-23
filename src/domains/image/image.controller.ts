import {
  Controller,
  Post,
  Route,
  Security,
  SuccessResponse,
  Tags,
  UploadedFile,
} from "tsoa";
import type { UploadImageSuccessResponseDto } from "./image.dto.js";
import * as imageService from "./image.service.js";

@Route("images")
@Tags("Image")
@Security("jwt")
export class ImageController extends Controller {
  /** 이미지 업로드 (multipart/form-data, 필드명 file, jpg/png/webp, 최대 10MB) */
  @Post()
  @SuccessResponse(201, "Created")
  public async upload(
    @UploadedFile("file") file?: Express.Multer.File,
  ): Promise<UploadImageSuccessResponseDto> {
    const data = await imageService.uploadImage(file);

    this.setStatus(201);
    return {
      success: true,
      code: "COMMON_201",
      message: "이미지가 업로드되었습니다.",
      data,
    };
  }
}
