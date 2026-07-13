import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import type {
  ConceptBoard,
  ConceptBoardData,
  ConceptBoardVersion,
  ConceptBoardVersionSource,
} from "@/modules/conceptBoards/domain/ConceptBoard";
import type { ConceptBoardRepository } from "@/modules/conceptBoards/domain/ConceptBoardRepository";

function toVersion(row: {
  id: string;
  conceptBoardId: string;
  versionNumber: number;
  data: unknown;
  source: string;
  createdAt: Date;
}): ConceptBoardVersion {
  return {
    id: row.id,
    conceptBoardId: row.conceptBoardId,
    versionNumber: row.versionNumber,
    data: row.data as unknown as ConceptBoardData,
    source: row.source === "user" ? "user" : "ai",
    createdAt: row.createdAt,
  };
}

export class PrismaConceptBoardRepository implements ConceptBoardRepository {
  async findByProjectId(projectId: string): Promise<ConceptBoard | null> {
    const row = await prisma.conceptBoard.findUnique({ where: { projectId } });
    if (!row?.currentVersionId) return null;

    const versionRow = await prisma.conceptBoardVersion.findUnique({ where: { id: row.currentVersionId } });
    if (!versionRow) return null;

    return { id: row.id, projectId: row.projectId, currentVersion: toVersion(versionRow) };
  }

  async createWithFirstVersion(
    projectId: string,
    data: ConceptBoardData,
    source: ConceptBoardVersionSource,
  ): Promise<ConceptBoard> {
    const board = await prisma.conceptBoard.create({ data: { projectId } });
    const version = await prisma.conceptBoardVersion.create({
      data: {
        conceptBoardId: board.id,
        versionNumber: 1,
        data: data as unknown as Prisma.InputJsonValue,
        source,
      },
    });
    await prisma.conceptBoard.update({ where: { id: board.id }, data: { currentVersionId: version.id } });

    return { id: board.id, projectId, currentVersion: toVersion(version) };
  }

  async addVersion(
    conceptBoardId: string,
    data: ConceptBoardData,
    source: ConceptBoardVersionSource,
  ): Promise<ConceptBoard> {
    const board = await prisma.conceptBoard.findUniqueOrThrow({ where: { id: conceptBoardId } });
    const lastVersion = await prisma.conceptBoardVersion.findFirst({
      where: { conceptBoardId },
      orderBy: { versionNumber: "desc" },
    });
    const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

    const version = await prisma.conceptBoardVersion.create({
      data: {
        conceptBoardId,
        versionNumber: nextVersionNumber,
        data: data as unknown as Prisma.InputJsonValue,
        source,
      },
    });
    await prisma.conceptBoard.update({ where: { id: conceptBoardId }, data: { currentVersionId: version.id } });

    return { id: conceptBoardId, projectId: board.projectId, currentVersion: toVersion(version) };
  }

  async listVersions(conceptBoardId: string): Promise<ConceptBoardVersion[]> {
    const rows = await prisma.conceptBoardVersion.findMany({
      where: { conceptBoardId },
      orderBy: { versionNumber: "desc" },
    });
    return rows.map(toVersion);
  }

  async getVersion(conceptBoardId: string, versionNumber: number): Promise<ConceptBoardVersion | null> {
    const row = await prisma.conceptBoardVersion.findUnique({
      where: { conceptBoardId_versionNumber: { conceptBoardId, versionNumber } },
    });
    return row ? toVersion(row) : null;
  }
}
