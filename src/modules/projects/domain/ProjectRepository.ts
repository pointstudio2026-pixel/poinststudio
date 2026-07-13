import type { Project } from "@/modules/projects/domain/Project";

export interface ListProjectsOptions {
  search?: string;
  limit?: number;
}

// findByIdForUser/save/delete match the canonical shape from
// 23_BackendArchitecture.md's Repository Rules example; listForUser is
// added for Task-005 (Dashboard).
export interface ProjectRepository {
  findByIdForUser(projectId: string, userId: string): Promise<Project | null>;
  listForUser(userId: string, options?: ListProjectsOptions): Promise<Project[]>;
  save(project: Project): Promise<void>;
  delete(projectId: string, userId: string): Promise<void>;
}
