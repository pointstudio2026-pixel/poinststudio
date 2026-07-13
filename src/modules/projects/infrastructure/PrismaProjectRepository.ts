import { prisma } from "@/shared/database/prisma";
import type { Project } from "@/modules/projects/domain/Project";
import type {
  ListProjectsOptions,
  ProjectRepository,
} from "@/modules/projects/domain/ProjectRepository";

export class PrismaProjectRepository implements ProjectRepository {
  async findByIdForUser(projectId: string, userId: string): Promise<Project | null> {
    return prisma.project.findFirst({
      where: { id: projectId, userId, deletedAt: null },
    });
  }

  async findById(projectId: string): Promise<Project | null> {
    return prisma.project.findFirst({ where: { id: projectId, deletedAt: null } });
  }

  async listForUser(userId: string, options?: ListProjectsOptions): Promise<Project[]> {
    // A user actively searching wants to find a project, not just skim
    // recents, so search isn't capped to the "recent 10" dashboard default.
    const limit = options?.limit ?? (options?.search ? 50 : 10);
    return prisma.project.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(options?.search
          ? { name: { contains: options.search, mode: "insensitive" } }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
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
        archivedAt: project.archivedAt,
      },
      update: {
        name: project.name,
        status: project.status,
        currentStep: project.currentStep,
        isFavorite: project.isFavorite,
        archivedAt: project.archivedAt,
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
