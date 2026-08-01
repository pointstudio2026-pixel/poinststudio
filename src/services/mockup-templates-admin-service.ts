import { apiFetch } from "@/services/http-client";

export interface MockupTemplateDto {
  id: string;
  category: string;
  name: string;
  slug: string;
  description: string;
  backgroundUrl: string;
  placementArea: { xPct: number; yPct: number; widthPct: number; heightPct: number };
  fullDesignPlacementArea: { xPct: number; yPct: number; widthPct: number; heightPct: number } | null;
  keywords: string[];
  containsKoreanText: boolean;
  hidden: boolean;
  isGeneric: boolean;
}

export function fetchAllMockupTemplatesForAdmin() {
  return apiFetch<{ templates: MockupTemplateDto[] }>("/api/admin/mockup-templates");
}

export interface GenerateMockupBackgroundInput {
  category: string;
  description: string;
  shape: string;
  containsKoreanText: boolean;
  isGeneric: boolean;
  referenceImage?: File | null;
}

export interface GeneratedMockupBackgroundDto {
  imageDataUri: string;
  prompt: string;
  provider: string;
  costAmount: number;
}

export function generateMockupBackgroundImage(input: GenerateMockupBackgroundInput) {
  const formData = new FormData();
  formData.append("category", input.category);
  formData.append("description", input.description);
  formData.append("shape", input.shape);
  formData.append("containsKoreanText", String(input.containsKoreanText));
  formData.append("isGeneric", String(input.isGeneric));
  if (input.referenceImage) formData.append("referenceImage", input.referenceImage);
  return apiFetch<{ result: GeneratedMockupBackgroundDto }>("/api/admin/mockup-templates/generate", {
    method: "POST",
    body: formData,
  });
}

export interface CreateMockupTemplateInput {
  category: string;
  name: string;
  description: string;
  imageDataUri: string;
  placementArea: { xPct: number; yPct: number; widthPct: number; heightPct: number };
  fullDesignPlacementArea?: { xPct: number; yPct: number; widthPct: number; heightPct: number } | null;
  keywords: string[];
  containsKoreanText: boolean;
  isGeneric: boolean;
}

export function createMockupTemplate(input: CreateMockupTemplateInput) {
  return apiFetch<{ template: MockupTemplateDto }>("/api/admin/mockup-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteMockupTemplate(id: string) {
  return apiFetch<{ ok: boolean; mode: "hidden" | "deleted" }>(`/api/admin/mockup-templates/${id}`, {
    method: "DELETE",
  });
}
