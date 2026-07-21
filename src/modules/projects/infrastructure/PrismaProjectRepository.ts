import { prisma } from "@/shared/database/prisma";
import type { Project } from "@/modules/projects/domain/Project";
import type {
  ListProjectsOptions,
  ProjectRepository,
} from "@/modules/projects/domain/ProjectRepository";

// 소유자 본인이거나, 소유자가 "팀에 공유"를 켜둔 프로젝트에 대해 그 소유자의
// 팀 멤버인 경우 접근을 허용한다(팀 기능). 이 OR 조건 하나만 느슨하게 풀면
// findByIdForUser를 쓰는 프로젝트 전역의 모든 유스케이스가 별도 수정 없이
// 팀 접근을 지원하게 된다 -- 단, DeleteProjectUseCase처럼 삭제같이 파괴적인
// 동작은 유스케이스 쪽에서 별도로 소유자 전용 체크를 추가해 막는다.
function accessibleByUser(userId: string) {
  return {
    OR: [
      { userId },
      { sharedWithTeam: true, user: { team: { memberships: { some: { userId } } } } },
    ],
  };
}

export class PrismaProjectRepository implements ProjectRepository {
  async findByIdForUser(projectId: string, userId: string): Promise<Project | null> {
    return prisma.project.findFirst({
      where: { id: projectId, deletedAt: null, ...accessibleByUser(userId) },
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
        deletedAt: null,
        ...accessibleByUser(userId),
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
        deliverableType: project.deliverableType,
        currentStep: project.currentStep,
        isFavorite: project.isFavorite,
        sharedWithTeam: project.sharedWithTeam,
        archivedAt: project.archivedAt,
      },
      update: {
        name: project.name,
        status: project.status,
        deliverableType: project.deliverableType,
        currentStep: project.currentStep,
        isFavorite: project.isFavorite,
        sharedWithTeam: project.sharedWithTeam,
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
