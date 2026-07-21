import { prisma } from "@/shared/database/prisma";
import type { LogoStyleSelection } from "@/modules/logoStyles/domain/LogoStyle";
import type { LogoStyleSelectionRepository } from "@/modules/logoStyles/domain/LogoStyleSelectionRepository";

function toSelection(row: {
  id: string;
  projectId: string;
  categoryIds: string[];
  primaryCategoryId: string;
  createdAt: Date;
}): LogoStyleSelection {
  return {
    id: row.id,
    projectId: row.projectId,
    categoryIds: row.categoryIds,
    primaryCategoryId: row.primaryCategoryId,
    createdAt: row.createdAt,
  };
}

export class PrismaLogoStyleSelectionRepository implements LogoStyleSelectionRepository {
  async create(
    projectId: string,
    categoryIds: string[],
    primaryCategoryId: string,
  ): Promise<LogoStyleSelection> {
    const row = await prisma.logoStyleSelection.create({
      data: { projectId, categoryIds, primaryCategoryId },
    });
    return toSelection(row);
  }

  async findLatestByProjectId(projectId: string): Promise<LogoStyleSelection | null> {
    const row = await prisma.logoStyleSelection.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    return row ? toSelection(row) : null;
  }
}
