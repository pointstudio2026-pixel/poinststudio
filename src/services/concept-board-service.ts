import { apiFetch } from "@/services/http-client";

export type ConceptBoardSectionKeyDto =
  | "hero_image"
  | "brand_summary"
  | "core_values"
  | "style_keywords"
  | "color_palette"
  | "typography_direction"
  | "logo_concepts"
  | "design_notes";

export interface ColorSwatchDto {
  hex: string;
  label: string;
}

export interface ConceptBoardDataDto {
  heroImageUrl: string | null;
  brandSummary: string;
  coreValues: string[];
  styleKeywords: string[];
  colorPalette: ColorSwatchDto[];
  typographyDirection: string;
  logoConceptImageUrls: string[];
  designNotes: string;
  sectionOrder: ConceptBoardSectionKeyDto[];
}

export interface ConceptBoardVersionDto {
  id: string;
  versionNumber: number;
  data: ConceptBoardDataDto;
  source: "ai" | "user";
  createdAt: string;
}

export interface ConceptBoardDto {
  id: string;
  projectId: string;
  currentVersion: ConceptBoardVersionDto;
}

export function generateConceptBoard(projectId: string) {
  return apiFetch<{ board: ConceptBoardDto }>("/api/concept-board/generate", {
    method: "POST",
    body: JSON.stringify({ projectId }),
  });
}

export function fetchConceptBoard(projectId: string) {
  return apiFetch<{ board: ConceptBoardDto; versions: ConceptBoardVersionDto[] }>(
    `/api/concept-board/${projectId}`,
  );
}

export function updateConceptBoard(projectId: string, patch: Partial<ConceptBoardDataDto>) {
  return apiFetch<{ board: ConceptBoardDto }>(`/api/concept-board/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function restoreConceptBoardVersion(projectId: string, versionNumber: number) {
  return apiFetch<{ board: ConceptBoardDto }>(`/api/concept-board/${projectId}/restore`, {
    method: "POST",
    body: JSON.stringify({ versionNumber }),
  });
}
