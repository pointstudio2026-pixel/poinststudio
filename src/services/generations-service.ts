import { apiFetch } from "@/services/http-client";

export type GenerationStatusDto = "pending" | "processing" | "completed" | "failed";

export interface GeneratedImageDto {
  url: string;
  thumbnailUrl: string;
}

export interface GenerationVersionDto {
  id: string;
  generationId: string;
  versionNumber: number;
  promptVersionId: string;
  status: GenerationStatusDto;
  provider: string | null;
  providerPreference: string | null;
  images: GeneratedImageDto[];
  errorMessage: string | null;
  costAmount: number | null;
  createdAt: string;
  completedAt: string | null;
}

export type AiImageProvider = "openai" | "gemini";

// 백엔드 src/modules/generations/domain/resultCap.ts와 동일한 값 -- 프로젝트당
// 누적 가능한 최대 결과 수(프론트에서 버튼 비활성화 판단에 사용).
export const MAX_PROJECT_RESULTS = 3;

export function createGeneration(projectId: string, provider?: AiImageProvider) {
  return apiFetch<{ generation: GenerationVersionDto }>("/api/generations", {
    method: "POST",
    body: JSON.stringify({ projectId, provider }),
  });
}

export function fetchGenerationHistory(projectId: string) {
  return apiFetch<{ generation: { id: string; projectId: string; currentVersion: GenerationVersionDto }; versions: GenerationVersionDto[] }>(
    `/api/generations/${projectId}`,
  );
}

export function fetchGenerationStatus(generationVersionId: string) {
  return apiFetch<{ generation: GenerationVersionDto }>(`/api/generations/status/${generationVersionId}`);
}

export function retryGeneration(generationVersionId: string) {
  return apiFetch<{ generation: GenerationVersionDto }>(`/api/generations/${generationVersionId}/retry`, {
    method: "POST",
  });
}

export interface GenerationFeedbackDto {
  id: string;
  generationVersionId: string;
  likedTags: string[];
  dislikedTags: string[];
  freeText: string | null;
  createdAt: string;
}

/** 완전히 선택 사항 -- 호출하지 않아도 다음 단계로 진행 가능. */
export function submitGenerationFeedback(
  generationVersionId: string,
  input: { likedTags: string[]; dislikedTags: string[]; freeText: string | null },
) {
  return apiFetch<{ feedback: GenerationFeedbackDto }>(`/api/generations/${generationVersionId}/feedback`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
