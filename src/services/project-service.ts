import { apiFetch } from "@/services/http-client";

export interface ProjectDto {
  id: string;
  name: string;
  status: string;
  deliverableType: string | null;
  currentStep: string;
  isFavorite: boolean;
  archivedAt: string | null;
  updatedAt: string;
}

export interface ProjectActivityDto {
  id: string;
  eventType: string;
  createdAt: string;
}

export function createProject(name: string) {
  return apiFetch<{ projectId: string; status: string }>("/api/projects", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function updateProject(
  id: string,
  patch: { name?: string; isFavorite?: boolean; archived?: boolean },
) {
  return apiFetch<{ project: ProjectDto }>(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteProject(id: string) {
  return apiFetch<{ deleted: boolean }>(`/api/projects/${id}`, { method: "DELETE" });
}

export function selectDeliverableType(id: string, deliverableType: string) {
  return apiFetch<{ project: ProjectDto }>(`/api/projects/${id}/deliverable-type`, {
    method: "POST",
    body: JSON.stringify({ deliverableType }),
  });
}

export function fetchProjectActivity(id: string) {
  return apiFetch<{ activity: ProjectActivityDto[] }>(`/api/projects/${id}/activity`);
}

export function shareProjectWithTeam(id: string, sharedWithTeam: boolean) {
  return apiFetch<{ project: ProjectDto }>(`/api/projects/${id}/share-with-team`, {
    method: "POST",
    body: JSON.stringify({ sharedWithTeam }),
  });
}
