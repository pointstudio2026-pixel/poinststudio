import { apiFetch } from "@/services/http-client";

export type PromptProviderDto = "openai" | "gemini" | "nanobanana";

export interface GenerationPayloadDto {
  provider: PromptProviderDto;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  parameters: Record<string, unknown>;
}

export interface PromptVersionDto {
  id: string;
  versionNumber: number;
  provider: PromptProviderDto;
  systemPrompt: string;
  userPrompt: string;
  hash: string;
  payload: GenerationPayloadDto;
  flaggedTerms: string[];
  createdAt: string;
}

export interface PromptDto {
  id: string;
  projectId: string;
  currentVersion: PromptVersionDto;
}

export function buildPrompt(projectId: string, provider?: PromptProviderDto) {
  return apiFetch<{ prompt: PromptDto }>("/api/prompts/build", {
    method: "POST",
    body: JSON.stringify({ projectId, provider }),
  });
}

export function fetchPrompt(projectId: string) {
  return apiFetch<{ prompt: PromptDto }>(`/api/prompts/${projectId}`);
}

export function fetchPromptVersions(projectId: string) {
  return apiFetch<{ versions: PromptVersionDto[] }>(`/api/prompts/${projectId}/versions`);
}
