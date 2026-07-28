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
  keywords?: string[];
}

export interface PastGenerationImageDto {
  projectId: string;
  projectName: string;
  generationVersionId: string;
  imageIndex: number;
  url: string;
  thumbnailUrl: string;
  createdAt: string;
}

export interface StandaloneMockupDto {
  id: string;
  userId: string;
  projectId: string;
  templateId: string;
  sourceType: "upload" | "past_generation";
  status: "pending" | "processing" | "completed" | "failed";
  resultImageUrl: string | null;
  thumbnailUrl: string | null;
  provider: string | null;
  errorMessage: string | null;
  costAmount: number | null;
  createdAt: string;
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

export function searchMockupTemplates(query: string) {
  return apiFetch<{ templates: MockupTemplateDto[] }>(`/api/mockups/templates/search?q=${encodeURIComponent(query)}`);
}

export function fetchPastGenerationImages() {
  return apiFetch<{ images: PastGenerationImageDto[] }>("/api/mockups/past-generations");
}

export function createStandaloneMockup(
  templateId: string,
  source: { type: "upload"; file: File } | { type: "past_generation"; imageUrl: string },
) {
  const formData = new FormData();
  formData.append("templateId", templateId);
  if (source.type === "upload") {
    formData.append("file", source.file);
  } else {
    formData.append("imageUrl", source.imageUrl);
  }
  return apiFetch<{ mockup: StandaloneMockupDto }>("/api/mockups/standalone", {
    method: "POST",
    body: formData,
  });
}
