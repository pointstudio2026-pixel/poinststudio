import type { Project } from "@/modules/projects/domain/Project";

// Matches the canonical shape from 23_BackendArchitecture.md's Repository
// Rules example.
export interface ProjectRepository {
  findByIdForUser(projectId: string, userId: string): Promise<Project | null>;
  save(project: Project): Promise<void>;
  delete(projectId: string, userId: string): Promise<void>;
}
