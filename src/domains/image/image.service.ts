import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { AppError } from "../../common/error.js";
import { getS3Client, getS3Config } from "../../config/s3.js";
import type { UploadImageResponseDto } from "./image.dto.js";

// 허용 형식(jpg/png/webp)과 용량 제한(10MB)
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function buildObjectKey(ext: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  return `review/${yyyy}${mm}${dd}/${randomUUID()}.${ext}`;
}

export async function uploadImage(
  file: Express.Multer.File | undefined,
): Promise<UploadImageResponseDto> {
  try {
    if (!file) {
      throw new AppError("COMMON_400", "이미지 파일(file)을 첨부해 주세요.");
    }

    const ext = ALLOWED_MIME_TO_EXT[file.mimetype];
    if (!ext) {
      throw new AppError("IMAGE_4001");
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new AppError("IMAGE_4002");
    }

    const config = getS3Config();
    if (!config) {
      // AWS 환경변수 미설정 (.env의 AWS_* 항목 확인)
      console.error("S3 환경변수가 설정되지 않아 이미지 업로드 불가");
      throw new AppError("IMAGE_5001");
    }

    const key = buildObjectKey(ext);

    await getS3Client(config).send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      imageUrl: `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error(error);
    throw new AppError("IMAGE_5001");
  }
}
