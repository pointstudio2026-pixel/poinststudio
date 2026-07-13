import { apiFetch } from "@/services/http-client";

export interface StyleDto {
  id: string;
  name: string;
  slug: string;
  level: 1 | 2 | 3;
  parentId: string | null;
  category: string;
  keywords: string[];
  description: string;
}

export interface StyleRecommendationDto {
  style: StyleDto;
  score: number;
  reason: string;
  alternatives: StyleDto[];
}

export interface StyleSelectionDto {
  id: string;
  projectId: string;
  primaryStyleId: string;
  secondaryStyleIds: string[];
  createdAt: string;
}

export function fetchStyles(params: { category?: string; search?: string; level?: number } = {}) {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  if (params.level) query.set("level", String(params.level));
  const qs = query.toString();
  return apiFetch<{ styles: StyleDto[]; categories: StyleDto[] }>(`/api/styles${qs ? `?${qs}` : ""}`);
}

export function recommendStyles(projectId: string) {
  return apiFetch<{ recommendations: StyleRecommendationDto[] }>("/api/styles/recommend", {
    method: "POST",
    body: JSON.stringify({ projectId }),
  });
}

export function selectStyle(projectId: string, primaryStyleId: string, secondaryStyleIds: string[]) {
  return apiFetch<{ selection: StyleSelectionDto }>("/api/styles/select", {
    method: "POST",
    body: JSON.stringify({ projectId, primaryStyleId, secondaryStyleIds }),
  });
}

export function fetchStyleHistory(projectId: string) {
  return apiFetch<{ current: StyleSelectionDto | null; history: StyleSelectionDto[] }>(
    `/api/styles/history/${projectId}`,
  );
}

export function toggleStyleFavorite(styleId: string, favorite: boolean) {
  return apiFetch<{ styleId: string; favorite: boolean }>("/api/styles/favorite", {
    method: "POST",
    body: JSON.stringify({ styleId, favorite }),
  });
}

export function fetchFavoriteStyles() {
  return apiFetch<{ styles: StyleDto[] }>("/api/styles/favorites");
}
