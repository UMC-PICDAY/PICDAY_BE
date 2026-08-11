// 이미지 업로드 API
export type UploadImageResponseDto = {
  imageUrl: string;
};

// responseWrapper 적용 후 Controller가 raw data DTO를 반환하므로 더 이상 사용하지 않음.
// 전체 도메인 마이그레이션이 끝난 뒤 삭제할 수 있도록 임시로 주석 처리한다.
// export type UploadImageSuccessResponseDto = {
//   success: true;
//   code: "COMMON_201";
//   message: string;
//   data: UploadImageResponseDto;
// };
