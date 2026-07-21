import { apiFetch } from "@/services/http-client";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface StrategyRecommendationDto {
  value: string;
  reason: string;
}

export interface BrandKnowledgeDto {
  industry: string;
  mission: string;
  vision: string;
  values: string[];
  positioning: string;
  audience: string;
  tone: string;
  personality: string;
  visualDirection: string;
  confidenceNotes: string;
  reasoningSummary: string;
  tagline: string;
  keywords: string[];
  preferredColor: string;
  typographyDirection: string;
}

export interface BrandStrategyProfileDto {
  positioning: string;
  coreMessage: string;
  toneAndManner: string;
  personality: string;
  brandArchetype: string;
  visualDirection: string;
  recommendedStyles: StrategyRecommendationDto[];
  recommendedColors: StrategyRecommendationDto[];
  recommendedTypography: StrategyRecommendationDto[];
  recommendedSymbols: StrategyRecommendationDto[];
}

export interface BrandStrategyDataDto {
  brandKnowledge: BrandKnowledgeDto;
  brandStrategy: BrandStrategyProfileDto;
  confidenceScore: number;
}

export interface BrandStrategyVersionDto {
  id: string;
  versionNumber: number;
  data: BrandStrategyDataDto;
  candidates: BrandStrategyDataDto[];
  selectedIndex: number | null;
  reasoningSummary: string;
  confidenceLevel: ConfidenceLevel;
  createdAt: string;
}

export interface BrandStrategyDto {
  id: string;
  projectId: string;
  currentVersion: BrandStrategyVersionDto;
}

export type AiTextProvider = "openai" | "gemini" | "claude";

export function executeAsterBrain(projectId: string, provider?: AiTextProvider) {
  return apiFetch<{ strategy: BrandStrategyDto }>("/api/aster-brain/execute", {
    method: "POST",
    body: JSON.stringify({ projectId, provider }),
  });
}

export function rebuildAsterBrain(projectId: string, provider?: AiTextProvider) {
  return apiFetch<{ strategy: BrandStrategyDto }>("/api/aster-brain/rebuild", {
    method: "POST",
    body: JSON.stringify({ projectId, provider }),
  });
}

export function selectBrandStrategy(projectId: string, candidateIndex: number) {
  return apiFetch<{ strategy: BrandStrategyDto }>("/api/aster-brain/select", {
    method: "POST",
    body: JSON.stringify({ projectId, candidateIndex }),
  });
}

export function fetchBrandStrategy(projectId: string) {
  return apiFetch<{ strategy: BrandStrategyDto; versions: BrandStrategyVersionDto[] }>(
    `/api/aster-brain/${projectId}`,
  );
}
