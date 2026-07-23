import { prisma } from "@/shared/database/prisma";
import type { StyleSelection } from "@/modules/styles/domain/Style";
import type { StyleSelectionRepository } from "@/modules/styles/domain/StyleSelectionRepository";

function toSelection(row: {
  id: string;
  projectId: string;
  primaryStyleId: string;
  secondaryStyleIds: string[];
  forbiddenStyleIds: string[];
  createdAt: Date;
}): StyleSelection {
  return {
    id: row.id,
    projectId: row.projectId,
    primaryStyleId: row.primaryStyleId,
    secondaryStyleIds: row.secondaryStyleIds,
    forbiddenStyleIds: row.forbiddenStyleIds,
    createdAt: row.createdAt,
  };
}

export class PrismaStyleSelectionRepository implements StyleSelectionRepository {
  async create(
    projectId: string,
    primaryStyleId: string,
    secondaryStyleIds: string[],
    forbiddenStyleIds: string[] = [],
  ): Promise<StyleSelection> {
    const row = await prisma.styleSelection.create({
      data: { projectId, primaryStyleId, secondaryStyleIds, forbiddenStyleIds },
    });
    return toSelection(row);
  }

  async findLatestByProjectId(projectId: string): Promise<StyleSelection | null> {
    const row = await prisma.styleSelection.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    return row ? toSelection(row) : null;
  }

  async listByProjectId(projectId: string): Promise<StyleSelection[]> {
    const rows = await prisma.styleSelection.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toSelection);
  }
}
