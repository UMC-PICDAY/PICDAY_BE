import {
  Controller,
  Post,
  Route,
  Security,
  SuccessResponse,
  Tags,
  UploadedFile,
} from "tsoa";
import { setSuccessMessage } from "../../common/response.js";
import type { UploadImageResponseDto } from "./image.dto.js";
import * as imageService from "./image.service.js";

@Route("images")
@Tags("Image")
@Security("jwt")
export class ImageController extends Controller {
  /**
   * 이미지 업로드
   *
   * multipart/form-data의 file 필드로 jpg, png, webp 이미지를 업로드한다.
   * 최대 파일 크기는 10MB이다.
   *
   * @summary 이미지 업로드
   * @param file 업로드할 이미지 파일
   */
  @Post()
  @SuccessResponse(201, "이미지 업로드 성공")
  public async upload(
    @UploadedFile("file") file?: Express.Multer.File,
  ): Promise<UploadImageResponseDto> {
    const data = await imageService.uploadImage(file);

    this.setStatus(201);
    setSuccessMessage(this, "이미지가 업로드되었습니다.");
    return data;
  }
}
