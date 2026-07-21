import { apiFetch } from "@/services/http-client";

export interface LogoStyleCategoryDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  subStyles: string[];
  keywords: string[];
  sampleImageUrl: string;
  sortOrder: number;
}

export interface LogoStyleRecommendationDto {
  category: LogoStyleCategoryDto;
  score: number;
  reason: string;
  representativeSubStyle: string;
}

export interface LogoStyleSelectionDto {
  id: string;
  projectId: string;
  categoryIds: string[];
  primaryCategoryId: string;
  createdAt: string;
}

export function fetchLogoStyleCategories() {
  return apiFetch<{ categories: LogoStyleCategoryDto[] }>("/api/logo-styles");
}

export function recommendLogoStyle(projectId: string) {
  return apiFetch<{ recommendations: LogoStyleRecommendationDto[] }>("/api/logo-styles/recommend", {
    method: "POST",
    body: JSON.stringify({ projectId }),
  });
}

export function selectLogoStyle(projectId: string, categoryIds: string[]) {
  return apiFetch<{ selection: LogoStyleSelectionDto }>("/api/logo-styles/select", {
    method: "POST",
    body: JSON.stringify({ projectId, categoryIds }),
  });
}
