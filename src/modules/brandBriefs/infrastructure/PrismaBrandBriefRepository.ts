import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import type {
  BrandBrief,
  BrandBriefData,
  BrandBriefVersion,
  BrandBriefVersionSource,
} from "@/modules/brandBriefs/domain/BrandBrief";
import type { BrandBriefRepository } from "@/modules/brandBriefs/domain/BrandBriefRepository";

function toVersion(row: {
  id: string;
  brandBriefId: string;
  versionNumber: number;
  data: unknown;
  source: string;
  createdAt: Date;
}): BrandBriefVersion {
  return {
    id: row.id,
    brandBriefId: row.brandBriefId,
    versionNumber: row.versionNumber,
    data: row.data as unknown as BrandBriefData,
    source: row.source === "user" ? "user" : "ai",
    createdAt: row.createdAt,
  };
}

export class PrismaBrandBriefRepository implements BrandBriefRepository {
  async findByProjectId(projectId: string): Promise<BrandBrief | null> {
    const row = await prisma.brandBrief.findUnique({ where: { projectId } });
    if (!row?.currentVersionId) return null;

    const versionRow = await prisma.brandBriefVersion.findUnique({
      where: { id: row.currentVersionId },
    });
    if (!versionRow) return null;

    return { id: row.id, projectId: row.projectId, currentVersion: toVersion(versionRow) };
  }

  async createWithFirstVersion(
    projectId: string,
    data: BrandBriefData,
    source: BrandBriefVersionSource,
    createdBy?: string,
  ): Promise<BrandBrief> {
    const brief = await prisma.brandBrief.create({ data: { projectId } });
    const version = await prisma.brandBriefVersion.create({
      data: {
        brandBriefId: brief.id,
        versionNumber: 1,
        data: data as unknown as Prisma.InputJsonValue,
        source,
        createdBy,
      },
    });
    await prisma.brandBrief.update({
      where: { id: brief.id },
      data: { currentVersionId: version.id },
    });

    return { id: brief.id, projectId, currentVersion: toVersion(version) };
  }

  async addVersion(
    brandBriefId: string,
    data: BrandBriefData,
    source: BrandBriefVersionSource,
    createdBy?: string,
  ): Promise<BrandBrief> {
    const brief = await prisma.brandBrief.findUniqueOrThrow({ where: { id: brandBriefId } });
    const lastVersion = await prisma.brandBriefVersion.findFirst({
      where: { brandBriefId },
      orderBy: { versionNumber: "desc" },
    });
    const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

    const version = await prisma.brandBriefVersion.create({
      data: {
        brandBriefId,
        versionNumber: nextVersionNumber,
        data: data as unknown as Prisma.InputJsonValue,
        source,
        createdBy,
      },
    });
    await prisma.brandBrief.update({
      where: { id: brandBriefId },
      data: { currentVersionId: version.id },
    });

    return { id: brandBriefId, projectId: brief.projectId, currentVersion: toVersion(version) };
  }

  async listVersions(brandBriefId: string): Promise<BrandBriefVersion[]> {
    const rows = await prisma.brandBriefVersion.findMany({
      where: { brandBriefId },
      orderBy: { versionNumber: "desc" },
    });
    return rows.map(toVersion);
  }

  async getVersion(brandBriefId: string, versionNumber: number): Promise<BrandBriefVersion | null> {
    const row = await prisma.brandBriefVersion.findUnique({
      where: { brandBriefId_versionNumber: { brandBriefId, versionNumber } },
    });
    return row ? toVersion(row) : null;
  }
}
