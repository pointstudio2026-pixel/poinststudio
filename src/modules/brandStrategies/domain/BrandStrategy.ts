export type ConfidenceLevel = "high" | "medium" | "low";

export interface BrandKnowledge {
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

export interface BrandStrategyData {
  brandKnowledge: BrandKnowledge;
  brandStrategy: BrandStrategyProfile;
  confidenceScore: number;
}

export interface BrandStrategyVersion {
  id: string;
  brandStrategyId: string;
  versionNumber: number;
  data: BrandStrategyData;
  /** 3 AI-generated candidates; `data` mirrors `candidates[selectedIndex]` once selected. */
  candidates: BrandStrategyData[];
  selectedIndex: number | null;
  reasoningSummary: string;
  confidenceLevel: ConfidenceLevel;
  createdAt: Date;
}

export interface BrandStrategy {
  id: string;
  projectId: string;
  currentVersion: BrandStrategyVersion;
}
