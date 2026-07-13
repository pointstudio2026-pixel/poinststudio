import { apiFetch } from "@/services/http-client";

export interface BrandBriefDataDto {
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

export interface BrandBriefVersionDto {
  id: string;
  versionNumber: number;
  data: BrandBriefDataDto;
  source: "ai" | "user";
  createdAt: string;
}

export interface BrandBriefDto {
  id: string;
  projectId: string;
  currentVersion: BrandBriefVersionDto;
}

export function generateBrandBrief(projectId: string) {
  return apiFetch<{ brief: BrandBriefDto }>("/api/brand-brief/generate", {
    method: "POST",
    body: JSON.stringify({ projectId }),
  });
}

export function fetchBrandBrief(projectId: string) {
  return apiFetch<{ brief: BrandBriefDto; versions: BrandBriefVersionDto[] }>(
    `/api/brand-brief/${projectId}`,
  );
}

export function updateBrandBrief(projectId: string, patch: Partial<BrandBriefDataDto>) {
  return apiFetch<{ brief: BrandBriefDto }>(`/api/brand-brief/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function restoreBrandBriefVersion(projectId: string, versionNumber: number) {
  return apiFetch<{ brief: BrandBriefDto }>(`/api/brand-brief/${projectId}/restore`, {
    method: "POST",
    body: JSON.stringify({ versionNumber }),
  });
}
