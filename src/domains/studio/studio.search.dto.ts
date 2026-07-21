import { z } from "zod";

// 사진관 자동완성 검색 API
export const getStudioAutocompleteRequestSchema = z.object({
  keyword: z.string(),
});

export type GetStudioAutocompleteRequestDto = {
  keyword: string;
};

export type GetStudioAutocompleteQuery = z.output<
  typeof getStudioAutocompleteRequestSchema
>;

export function parseGetStudioAutocompleteRequest(
  input: GetStudioAutocompleteRequestDto,
): GetStudioAutocompleteQuery {
  return getStudioAutocompleteRequestSchema.parse(input);
}

// 사진관 자동완성 검색 응답
export const studioAutocompleteSuggestionSchema = z.object({
  studioId: z.bigint().transform((id) => Number(id)),
  studioName: z.string(),
  locationCategory: z.string(),
});

export type StudioAutocompleteSuggestionInputDto = z.input<
  typeof studioAutocompleteSuggestionSchema
>;

export const studioAutocompleteResponseSchema = z.object({
  keyword: z.string(),
  suggestions: z.array(studioAutocompleteSuggestionSchema),
});

export type StudioAutocompleteResponseInputDto = z.input<
  typeof studioAutocompleteResponseSchema
>;

export type StudioAutocompleteResponseDto = z.output<
  typeof studioAutocompleteResponseSchema
>;

export function createStudioAutocompleteResponse(
  input: StudioAutocompleteResponseInputDto,
): StudioAutocompleteResponseDto {
  return studioAutocompleteResponseSchema.parse(input);
}
