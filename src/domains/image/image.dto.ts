// 이미지 업로드 API
export type UploadImageResponseDto = {
  imageUrl: string;
};

export type UploadImageSuccessResponseDto = {
  success: true;
  code: "COMMON_201";
  message: string;
  data: UploadImageResponseDto;
};
