import type { Project } from "@/modules/projects/domain/Project";
import type { ListProjectsOptions, ProjectRepository } from "@/modules/projects/domain/ProjectRepository";

export class FakeProjectRepository implements ProjectRepository {
  projects: Project[] = [];

  async findByIdForUser(projectId: string, userId: string) {
    return this.projects.find((p) => p.id === projectId && p.userId === userId) ?? null;
  }

  async findById(projectId: string) {
    return this.projects.find((p) => p.id === projectId) ?? null;
  }

  async listForUser(userId: string, options?: ListProjectsOptions) {
    const limit = options?.limit ?? (options?.search ? 50 : 10);
    return this.projects
      .filter((p) => p.userId === userId)
      .filter((p) =>
        options?.search
          ? p.name.toLowerCase().includes(options.search.toLowerCase())
          : true,
      )
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }

  async save(project: Project) {
    const index = this.projects.findIndex((p) => p.id === project.id);
    if (index === -1) {
      this.projects.push(project);
    } else {
      this.projects[index] = project;
    }
  }

  async delete(projectId: string, userId: string) {
    this.projects = this.projects.filter(
      (p) => !(p.id === projectId && p.userId === userId),
    );
  }
}
