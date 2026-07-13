import { prisma } from "@/shared/database/prisma";
import type { Project } from "@/modules/projects/domain/Project";
import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";

export class PrismaProjectRepository implements ProjectRepository {
  async findByIdForUser(projectId: string, userId: string): Promise<Project | null> {
    return prisma.project.findFirst({
      where: { id: projectId, userId, deletedAt: null },
    });
  }

  async save(project: Project): Promise<void> {
    await prisma.project.upsert({
      where: { id: project.id },
      create: {
        id: project.id,
        userId: project.userId,
        name: project.name,
        status: project.status,
        currentStep: project.currentStep,
        isFavorite: project.isFavorite,
      },
      update: {
        name: project.name,
        status: project.status,
        currentStep: project.currentStep,
        isFavorite: project.isFavorite,
      },
    });
  }

  async delete(projectId: string, userId: string): Promise<void> {
    // Soft delete per 22_DatabaseArchitecture.md's Soft Delete Policy.
    await prisma.project.updateMany({
      where: { id: projectId, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
