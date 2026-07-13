import { prisma } from "@/shared/database/prisma";
import type { BrandBriefData } from "@/modules/brandBriefs/domain/BrandBrief";
import type {
  BrandBriefSignalRow,
  DesignMemorySignalsRepository,
  EditPresetCount,
  MockupCategoryCount,
  StyleSelectionCount,
} from "@/modules/designMemory/domain/DesignMemorySignalsRepository";

export class PrismaDesignMemorySignalsRepository implements DesignMemorySignalsRepository {
  async topStyleSelections(userId: string, since: Date, limit: number): Promise<StyleSelectionCount[]> {
    const rows = await prisma.styleSelection.groupBy({
      by: ["primaryStyleId"],
      where: { project: { userId }, createdAt: { gte: since } },
      _count: { primaryStyleId: true },
      orderBy: { _count: { primaryStyleId: "desc" } },
      take: limit,
    });
    return rows.map((r) => ({ styleId: r.primaryStyleId, count: r._count.primaryStyleId }));
  }

  async topEditPresets(userId: string, since: Date, limit: number): Promise<EditPresetCount[]> {
    const rows = await prisma.editHistory.groupBy({
      by: ["presetKey"],
      where: { generation: { project: { userId } }, createdAt: { gte: since }, status: "completed" },
      _count: { presetKey: true },
      orderBy: { _count: { presetKey: "desc" } },
      take: limit,
    });
    return rows.map((r) => ({ presetKey: r.presetKey, count: r._count.presetKey }));
  }

  async listBrandBriefSignals(userId: string, since: Date): Promise<BrandBriefSignalRow[]> {
    const briefs = await prisma.brandBrief.findMany({
      where: { project: { userId }, createdAt: { gte: since } },
      select: { currentVersionId: true },
    });
    const versionIds = briefs.map((b) => b.currentVersionId).filter((id): id is string => Boolean(id));
    if (versionIds.length === 0) return [];

    const versions = await prisma.brandBriefVersion.findMany({ where: { id: { in: versionIds } } });
    return versions.map((v) => {
      const data = v.data as unknown as BrandBriefData;
      return {
        industry: data.industry ?? "",
        preferredColor: data.preferredColor ?? "",
        typographyDirection: data.typographyDirection ?? "",
      };
    });
  }

  async favoriteMockupCategories(userId: string): Promise<MockupCategoryCount[]> {
    const rows = await prisma.mockupProject.findMany({
      where: { project: { userId }, isFavorite: true },
      include: { template: { select: { category: true } } },
    });

    const counts = new Map<string, number>();
    for (const row of rows) {
      counts.set(row.template.category, (counts.get(row.template.category) ?? 0) + 1);
    }
    return [...counts.entries()].map(([category, count]) => ({ category, count }));
  }
}
