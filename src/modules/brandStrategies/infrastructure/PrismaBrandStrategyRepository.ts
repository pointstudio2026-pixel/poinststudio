import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import type {
  BrandStrategy,
  BrandStrategyData,
  BrandStrategyVersion,
  ConfidenceLevel,
} from "@/modules/brandStrategies/domain/BrandStrategy";
import type { BrandStrategyRepository } from "@/modules/brandStrategies/domain/BrandStrategyRepository";

function toVersion(row: {
  id: string;
  brandStrategyId: string;
  versionNumber: number;
  data: unknown;
  reasoningSummary: string | null;
  confidence: string;
  createdAt: Date;
}): BrandStrategyVersion {
  return {
    id: row.id,
    brandStrategyId: row.brandStrategyId,
    versionNumber: row.versionNumber,
    data: row.data as unknown as BrandStrategyData,
    reasoningSummary: row.reasoningSummary ?? "",
    confidenceLevel: row.confidence as ConfidenceLevel,
    createdAt: row.createdAt,
  };
}

export class PrismaBrandStrategyRepository implements BrandStrategyRepository {
  async findByProjectId(projectId: string): Promise<BrandStrategy | null> {
    const row = await prisma.brandStrategy.findUnique({ where: { projectId } });
    if (!row?.currentVersionId) return null;

    const versionRow = await prisma.brandStrategyVersion.findUnique({
      where: { id: row.currentVersionId },
    });
    if (!versionRow) return null;

    return { id: row.id, projectId: row.projectId, currentVersion: toVersion(versionRow) };
  }

  async createWithFirstVersion(
    projectId: string,
    data: BrandStrategyData,
    reasoningSummary: string,
    confidenceLevel: ConfidenceLevel,
  ): Promise<BrandStrategy> {
    const strategy = await prisma.brandStrategy.create({ data: { projectId } });
    const version = await prisma.brandStrategyVersion.create({
      data: {
        brandStrategyId: strategy.id,
        versionNumber: 1,
        data: data as unknown as Prisma.InputJsonValue,
        reasoningSummary,
        confidence: confidenceLevel,
      },
    });
    await prisma.brandStrategy.update({
      where: { id: strategy.id },
      data: { currentVersionId: version.id },
    });

    return { id: strategy.id, projectId, currentVersion: toVersion(version) };
  }

  async addVersion(
    brandStrategyId: string,
    data: BrandStrategyData,
    reasoningSummary: string,
    confidenceLevel: ConfidenceLevel,
  ): Promise<BrandStrategy> {
    const strategy = await prisma.brandStrategy.findUniqueOrThrow({ where: { id: brandStrategyId } });
    const lastVersion = await prisma.brandStrategyVersion.findFirst({
      where: { brandStrategyId },
      orderBy: { versionNumber: "desc" },
    });
    const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

    const version = await prisma.brandStrategyVersion.create({
      data: {
        brandStrategyId,
        versionNumber: nextVersionNumber,
        data: data as unknown as Prisma.InputJsonValue,
        reasoningSummary,
        confidence: confidenceLevel,
      },
    });
    await prisma.brandStrategy.update({
      where: { id: brandStrategyId },
      data: { currentVersionId: version.id },
    });

    return { id: brandStrategyId, projectId: strategy.projectId, currentVersion: toVersion(version) };
  }

  async listVersions(brandStrategyId: string): Promise<BrandStrategyVersion[]> {
    const rows = await prisma.brandStrategyVersion.findMany({
      where: { brandStrategyId },
      orderBy: { versionNumber: "desc" },
    });
    return rows.map(toVersion);
  }
}
