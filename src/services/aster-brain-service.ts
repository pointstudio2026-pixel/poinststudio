import { apiFetch } from "@/services/http-client";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface StrategyRecommendationDto {
  value: string;
  reason: string;
}

export interface BrandKnowledgeDto {
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

export interface StyleCandidateDto {
  name: string;
  reason: string;
}

export interface BrandStrategyDataDto {
  brandKnowledge: BrandKnowledgeDto;
  brandStrategy: BrandStrategyProfileDto;
  styleCandidates: StyleCandidateDto[];
  confidenceScore: number;
}

export interface BrandStrategyVersionDto {
  id: string;
  versionNumber: number;
  data: BrandStrategyDataDto;
  reasoningSummary: string;
  confidenceLevel: ConfidenceLevel;
  createdAt: string;
}

export interface BrandStrategyDto {
  id: string;
  projectId: string;
  currentVersion: BrandStrategyVersionDto;
}

export function executeAsterBrain(projectId: string) {
  return apiFetch<{ strategy: BrandStrategyDto }>("/api/aster-brain/execute", {
    method: "POST",
    body: JSON.stringify({ projectId }),
  });
}

export function rebuildAsterBrain(projectId: string) {
  return apiFetch<{ strategy: BrandStrategyDto }>("/api/aster-brain/rebuild", {
    method: "POST",
    body: JSON.stringify({ projectId }),
  });
}

export function fetchBrandStrategy(projectId: string) {
  return apiFetch<{ strategy: BrandStrategyDto; versions: BrandStrategyVersionDto[] }>(
    `/api/aster-brain/${projectId}`,
  );
}
