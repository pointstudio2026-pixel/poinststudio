import { apiFetch } from "@/services/http-client";
import type { Locale } from "@/shared/i18n/locale";

export interface IndustryDto {
  id: string;
  name: string;
  /** 현재 locale로 표시할 이름 -- 답변 저장 시엔 반드시 name(한국어 원문)을 써야 한다. */
  displayName: string;
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

export function searchIndustries(query: string, locale: Locale = "ko") {
  return apiFetch<{ industries: IndustryDto[] }>(
    `/api/industries/search?q=${encodeURIComponent(query)}&locale=${locale}`,
  );
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
