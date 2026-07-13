import { apiFetch } from "@/services/http-client";

export function createProject(name: string) {
  return apiFetch<{ projectId: string; status: string }>("/api/projects", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}
