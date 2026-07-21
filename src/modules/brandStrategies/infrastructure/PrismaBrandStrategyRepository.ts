import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import type {
  BrandStrategy,
  BrandStrategyData,
  BrandStrategyVersion,
  ConfidenceLevel,
} from "@/modules/brandStrategies/domain/BrandStrategy";
import type { BrandStrategyRepository } from "@/modules/brandStrategies/domain/BrandStrategyRepository";
import { NotFoundError } from "@/shared/errors/AppError";

function toVersion(row: {
  id: string;
  brandStrategyId: string;
  versionNumber: number;
  data: unknown;
  candidates: unknown;
  selectedIndex: number | null;
  reasoningSummary: string | null;
  confidence: string;
  createdAt: Date;
}): BrandStrategyVersion {
  return {
    id: row.id,
    brandStrategyId: row.brandStrategyId,
    versionNumber: row.versionNumber,
    data: row.data as unknown as BrandStrategyData,
    candidates: row.candidates as unknown as BrandStrategyData[],
    selectedIndex: row.selectedIndex,
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
    candidates: BrandStrategyData[],
    reasoningSummary: string,
    confidenceLevel: ConfidenceLevel,
  ): Promise<BrandStrategy> {
    const strategy = await prisma.brandStrategy.create({ data: { projectId } });
    const version = await prisma.brandStrategyVersion.create({
      data: {
        brandStrategyId: strategy.id,
        versionNumber: 1,
        data: candidates[0] as unknown as Prisma.InputJsonValue,
        candidates: candidates as unknown as Prisma.InputJsonValue,
        selectedIndex: null,
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
    candidates: BrandStrategyData[],
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
        data: candidates[0] as unknown as Prisma.InputJsonValue,
        candidates: candidates as unknown as Prisma.InputJsonValue,
        selectedIndex: null,
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

  async selectCandidate(brandStrategyId: string, candidateIndex: number): Promise<BrandStrategy> {
    const strategy = await prisma.brandStrategy.findUniqueOrThrow({ where: { id: brandStrategyId } });
    if (!strategy.currentVersionId) {
      throw new NotFoundError("Brand Strategy 버전을 찾을 수 없습니다.", "BRAND_STRATEGY_VERSION_NOT_FOUND");
    }
    const currentVersionRow = await prisma.brandStrategyVersion.findUniqueOrThrow({
      where: { id: strategy.currentVersionId },
    });
    const candidates = currentVersionRow.candidates as unknown as BrandStrategyData[];
    const selected = candidates[candidateIndex]!;

    const version = await prisma.brandStrategyVersion.update({
      where: { id: currentVersionRow.id },
      data: {
        data: selected as unknown as Prisma.InputJsonValue,
        selectedIndex: candidateIndex,
        reasoningSummary: selected.brandKnowledge.reasoningSummary,
      },
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
