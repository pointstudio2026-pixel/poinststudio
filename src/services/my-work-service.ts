import { apiFetch } from "@/services/http-client";

export interface MyWorkItemDto {
  id: string;
  sourceType: "generation" | "standalone_mockup";
  imageUrl: string;
  thumbnailUrl: string;
  projectName: string;
  createdAt: string;
}

export function fetchMyWork() {
  return apiFetch<{ items: MyWorkItemDto[] }>("/api/my-work");
}
