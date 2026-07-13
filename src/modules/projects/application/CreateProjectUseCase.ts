import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { Project } from "@/modules/projects/domain/Project";
import { recordActivity } from "@/shared/activity/activityLogger";

export interface CreateProjectOutput {
  projectId: string;
  status: string;
}

export class CreateProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: { userId: string; name: string }): Promise<CreateProjectOutput> {
    const project: Project = {
      id: crypto.randomUUID(),
      userId: input.userId,
      name: input.name,
      status: "draft",
      currentStep: "brand_interview",
      isFavorite: false,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.projectRepository.save(project);

    await recordActivity({
      userId: input.userId,
      projectId: project.id,
      eventType: "PROJECT_CREATED",
      payload: { name: project.name },
    });

    return { projectId: project.id, status: project.status };
  }
}
