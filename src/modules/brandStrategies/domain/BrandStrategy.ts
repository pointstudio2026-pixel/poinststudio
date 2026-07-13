export type ConfidenceLevel = "high" | "medium" | "low";

export interface BrandKnowledge {
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

export interface StrategyRecommendation {
  value: string;
  reason: string;
}

export interface BrandStrategyProfile {
  positioning: string;
  coreMessage: string;
  toneAndManner: string;
  personality: string;
  brandArchetype: string;
  visualDirection: string;
  recommendedStyles: StrategyRecommendation[];
  recommendedColors: StrategyRecommendation[];
  recommendedTypography: StrategyRecommendation[];
  recommendedSymbols: StrategyRecommendation[];
}

export interface StyleCandidate {
  name: string;
  reason: string;
}

export interface BrandStrategyData {
  brandKnowledge: BrandKnowledge;
  brandStrategy: BrandStrategyProfile;
  styleCandidates: StyleCandidate[];
  confidenceScore: number;
}

export interface BrandStrategyVersion {
  id: string;
  brandStrategyId: string;
  versionNumber: number;
  data: BrandStrategyData;
  reasoningSummary: string;
  confidenceLevel: ConfidenceLevel;
  createdAt: Date;
}

export interface BrandStrategy {
  id: string;
  projectId: string;
  currentVersion: BrandStrategyVersion;
}
