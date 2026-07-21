import { prisma } from "@/shared/database/prisma";
import type { ProjectUserStyleSelection } from "@/modules/userStyles/domain/UserStyle";
import type { ProjectUserStyleSelectionRepository } from "@/modules/userStyles/domain/ProjectUserStyleSelectionRepository";

function toSelection(row: {
  id: string;
  projectId: string;
  userStyleCategoryId: string;
  createdAt: Date;
}): ProjectUserStyleSelection {
  return {
    id: row.id,
    projectId: row.projectId,
    userStyleCategoryId: row.userStyleCategoryId,
    createdAt: row.createdAt,
  };
}

export class PrismaProjectUserStyleSelectionRepository implements ProjectUserStyleSelectionRepository {
  async create(projectId: string, userStyleCategoryId: string): Promise<ProjectUserStyleSelection> {
    const row = await prisma.projectUserStyleSelection.create({ data: { projectId, userStyleCategoryId } });
    return toSelection(row);
  }

  async findLatestByProjectId(projectId: string): Promise<ProjectUserStyleSelection | null> {
    const row = await prisma.projectUserStyleSelection.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    return row ? toSelection(row) : null;
  }
}
