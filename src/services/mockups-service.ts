import { apiFetch } from "@/services/http-client";

export type MockupCategoryDto =
  | "business_card"
  | "signboard"
  | "mobile_app"
  | "website_hero"
  | "brochure"
  | "poster"
  | "package"
  | "leaflet"
  | "banner"
  | "uniform";

export const MOCKUP_CATEGORY_LABELS: Record<MockupCategoryDto, string> = {
  business_card: "명함",
  signboard: "간판",
  mobile_app: "모바일 앱",
  website_hero: "웹사이트",
  brochure: "브로슈어",
  poster: "포스터",
  package: "패키지",
  leaflet: "리플렛",
  banner: "배너",
  uniform: "유니폼",
};

export interface MockupTemplateDto {
  id: string;
  category: MockupCategoryDto;
  name: string;
  slug: string;
  description: string;
  backgroundUrl: string;
  placementArea: { xPct: number; yPct: number; widthPct: number; heightPct: number };
}

export interface MockupCategoryRecommendationDto {
  category: MockupCategoryDto;
  score: number;
  reason: string;
}

export interface MockupProjectDto {
  id: string;
  projectId: string;
  generationVersionId: string;
  sourceImageIndex: number;
  templateId: string;
  status: "pending" | "processing" | "completed" | "failed";
  resultImageUrl: string | null;
  thumbnailUrl: string | null;
  provider: string | null;
  isFavorite: boolean;
  errorMessage: string | null;
  costAmount: number | null;
  createdAt: string;
  completedAt: string | null;
}

export function fetchMockupTemplates(category?: MockupCategoryDto) {
  const qs = category ? `?category=${category}` : "";
  return apiFetch<{ templates: MockupTemplateDto[]; categories: MockupCategoryDto[] }>(
    `/api/mockups/templates${qs}`,
  );
}

export function recommendMockupCategories(projectId: string) {
  return apiFetch<{ recommendations: MockupCategoryRecommendationDto[] }>("/api/mockups/recommend", {
    method: "POST",
    body: JSON.stringify({ projectId }),
  });
}

export function createMockup(
  projectId: string,
  generationVersionId: string,
  sourceImageIndex: number,
  templateId: string,
) {
  return apiFetch<{ mockup: MockupProjectDto }>("/api/mockups/render", {
    method: "POST",
    body: JSON.stringify({ projectId, generationVersionId, sourceImageIndex, templateId }),
  });
}

export function fetchMockups(projectId: string, category?: MockupCategoryDto) {
  const qs = category ? `?category=${category}` : "";
  return apiFetch<{ mockups: MockupProjectDto[] }>(`/api/mockups/${projectId}${qs}`);
}

export function toggleMockupFavorite(mockupId: string, favorite: boolean) {
  return apiFetch<{ mockup: MockupProjectDto }>("/api/mockups/favorite", {
    method: "POST",
    body: JSON.stringify({ mockupId, favorite }),
  });
}

export function deleteMockup(mockupId: string) {
  return apiFetch<{ deleted: boolean }>(`/api/mockups/${mockupId}`, { method: "DELETE" });
}
