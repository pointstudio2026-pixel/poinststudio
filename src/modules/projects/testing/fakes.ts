import type { Project } from "@/modules/projects/domain/Project";
import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";

export class FakeProjectRepository implements ProjectRepository {
  projects: Project[] = [];

  async findByIdForUser(projectId: string, userId: string) {
    return this.projects.find((p) => p.id === projectId && p.userId === userId) ?? null;
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
