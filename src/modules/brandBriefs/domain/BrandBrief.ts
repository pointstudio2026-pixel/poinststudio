export interface BrandBriefData {
  brandName: string;
  industry: string;
  tagline: string;
  description: string;
  mission: string;
  vision: string;
  coreValues: string[];
  positioning: string;
  primaryAudience: string;
  secondaryAudience: string;
  customerProblems: string;
  desiredImpression: string;
  brandTone: string;
  brandPersonality: string;
  keywords: string[];
  avoidKeywords: string[];
  preferredStyle: string;
  preferredColor: string;
  preferredSymbol: string;
  typographyDirection: string;
}

export type BrandBriefVersionSource = "ai" | "user";

export interface BrandBriefVersion {
  id: string;
  brandBriefId: string;
  versionNumber: number;
  data: BrandBriefData;
  source: BrandBriefVersionSource;
  createdAt: Date;
}

export interface BrandBrief {
  id: string;
  projectId: string;
  currentVersion: BrandBriefVersion;
}
