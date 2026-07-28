import { apiFetch } from "@/services/http-client";

export interface IndustryDto {
  id: string;
  name: string;
  seoSlug: string;
  category: string;
  description: string;
  recommendedColors: string[];
  recommendedLogoStyles: string[];
  recommendedTypography: string[];
  recommendedPersonality: string[];
  recommendedKeywords: string[];
  isActive: boolean;
}

export function searchIndustries(query: string) {
  return apiFetch<{ industries: IndustryDto[] }>(`/api/industries/search?q=${encodeURIComponent(query)}`);
}

export function fetchAllIndustriesForAdmin() {
  return apiFetch<{ industries: IndustryDto[] }>("/api/admin/industries");
}

export interface IndustryFormInput {
  name: string;
  seoSlug: string;
  category: string;
  description: string;
  recommendedColors: string[];
  recommendedLogoStyles: string[];
  recommendedTypography: string[];
  recommendedPersonality: string[];
  recommendedKeywords: string[];
  isActive?: boolean;
}

export function createIndustry(input: IndustryFormInput) {
  return apiFetch<{ industry: IndustryDto }>("/api/admin/industries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateIndustry(id: string, input: Partial<IndustryFormInput>) {
  return apiFetch<{ industry: IndustryDto }>(`/api/admin/industries/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteIndustry(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/admin/industries/${id}`, { method: "DELETE" });
}
