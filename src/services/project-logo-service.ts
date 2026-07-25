import { apiFetch } from "@/services/http-client";

export interface ProjectLogoAssetDto {
  id: string;
  projectId: string;
  contentType: string;
  originalFileName: string | null;
  createdAt: string;
}

export interface ProjectDto {
  id: string;
  currentStep: string;
}

export function uploadProjectLogo(projectId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<{ asset: ProjectLogoAssetDto }>(`/api/projects/${projectId}/logo`, {
    method: "POST",
    body: formData,
  });
}

export function projectLogoImageUrl(projectId: string) {
  return `/api/projects/${projectId}/logo/image`;
}

export function selectLogoChoice(projectId: string, choice: "upload" | "skip") {
  return apiFetch<{ project: ProjectDto }>(`/api/projects/${projectId}/logo-choice`, {
    method: "POST",
    body: JSON.stringify({ choice }),
  });
}
