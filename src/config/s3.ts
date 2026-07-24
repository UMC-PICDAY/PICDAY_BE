import { S3Client } from "@aws-sdk/client-s3";

// S3 설정은 업로드 시점에 검증한다.
// (키가 없어도 서버 부팅은 가능해야 다른 도메인 개발에 지장이 없음)
export type S3Config = {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export function getS3Config(): S3Config | null {
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }
  return { region, bucket, accessKeyId, secretAccessKey };
}

let client: S3Client | null = null;

export function getS3Client(config: S3Config): S3Client {
  client ??= new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return client;
}
