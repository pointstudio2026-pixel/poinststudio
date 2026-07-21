import { apiFetch } from "@/services/http-client";

export interface UserStyleReferenceDto {
  id: string;
  categoryId: string;
  contentType: string;
  createdAt: string;
}

export interface UserStyleCategoryDto {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  references: UserStyleReferenceDto[];
}

export function fetchUserStyleCategories() {
  return apiFetch<{ categories: UserStyleCategoryDto[] }>("/api/user-styles/categories");
}

export function createUserStyleCategory(name: string) {
  return apiFetch<{ category: UserStyleCategoryDto }>("/api/user-styles/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function deleteUserStyleCategory(id: string) {
  return apiFetch<{ deleted: boolean }>(`/api/user-styles/categories/${id}`, { method: "DELETE" });
}

export function addUserStyleReferenceImage(categoryId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<{ category: UserStyleCategoryDto }>(`/api/user-styles/categories/${categoryId}/references`, {
    method: "POST",
    body: formData,
  });
}

export function reanalyzeUserStyleCategory(categoryId: string) {
  return apiFetch<{ category: UserStyleCategoryDto }>(`/api/user-styles/categories/${categoryId}/reanalyze`, {
    method: "POST",
  });
}

export function userStyleReferenceImageUrl(referenceId: string) {
  return `/api/user-styles/references/${referenceId}/image`;
}

export function selectProjectUserStyle(projectId: string, userStyleCategoryId: string) {
  return apiFetch<{ selection: { id: string; projectId: string; userStyleCategoryId: string; createdAt: string } }>(
    `/api/projects/${projectId}/user-style`,
    { method: "POST", body: JSON.stringify({ userStyleCategoryId }) },
  );
}
