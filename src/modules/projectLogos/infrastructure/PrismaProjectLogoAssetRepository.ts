import { prisma } from "@/shared/database/prisma";
import type { ProjectLogoAsset } from "@/modules/projectLogos/domain/ProjectLogoAsset";
import type { ProjectLogoAssetRepository } from "@/modules/projectLogos/domain/ProjectLogoAssetRepository";

function toAsset(row: {
  id: string;
  projectId: string;
  storageKey: string;
  contentType: string;
  originalFileName: string | null;
  createdAt: Date;
}): ProjectLogoAsset {
  return {
    id: row.id,
    projectId: row.projectId,
    storageKey: row.storageKey,
    contentType: row.contentType,
    originalFileName: row.originalFileName,
    createdAt: row.createdAt,
  };
}

export class PrismaProjectLogoAssetRepository implements ProjectLogoAssetRepository {
  async save(input: {
    projectId: string;
    storageKey: string;
    contentType: string;
    originalFileName?: string | null;
  }): Promise<ProjectLogoAsset> {
    const row = await prisma.projectLogoAsset.upsert({
      where: { projectId: input.projectId },
      create: {
        projectId: input.projectId,
        storageKey: input.storageKey,
        contentType: input.contentType,
        originalFileName: input.originalFileName ?? null,
      },
      update: {
        storageKey: input.storageKey,
        contentType: input.contentType,
        originalFileName: input.originalFileName ?? null,
      },
    });
    return toAsset(row);
  }

  async findByProjectId(projectId: string): Promise<ProjectLogoAsset | null> {
    const row = await prisma.projectLogoAsset.findUnique({ where: { projectId } });
    return row ? toAsset(row) : null;
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    await prisma.projectLogoAsset.deleteMany({ where: { projectId } });
  }
}
