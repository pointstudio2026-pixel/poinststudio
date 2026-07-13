import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { Project } from "@/modules/projects/domain/Project";

export class ListProjectsUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: { userId: string; search?: string }): Promise<Project[]> {
    return this.projectRepository.listForUser(input.userId, { search: input.search });
  }
}
