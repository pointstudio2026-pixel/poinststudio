import { prisma } from "@/shared/database/prisma";
import type { BrandStrategyData } from "@/modules/brandStrategies/domain/BrandStrategy";
import type {
  BrandStrategySignalRow,
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
    // 대화형(자유 텍스트) 수정은 preset_key가 null이라 "즐겨 쓰는 프리셋"
    // 집계 대상이 아니다 -- 여기서 명시적으로 제외한다.
    const rows = await prisma.editHistory.groupBy({
      by: ["presetKey"],
      where: {
        generation: { project: { userId } },
        createdAt: { gte: since },
        status: "completed",
        presetKey: { not: null },
      },
      _count: { presetKey: true },
      orderBy: { _count: { presetKey: "desc" } },
      take: limit,
    });
    return rows
      .filter((r): r is typeof r & { presetKey: string } => r.presetKey !== null)
      .map((r) => ({ presetKey: r.presetKey, count: r._count.presetKey }));
  }

  async listBrandStrategySignals(userId: string, since: Date): Promise<BrandStrategySignalRow[]> {
    const strategies = await prisma.brandStrategy.findMany({
      where: { project: { userId }, createdAt: { gte: since } },
      select: { currentVersionId: true },
    });
    const versionIds = strategies.map((s) => s.currentVersionId).filter((id): id is string => Boolean(id));
    if (versionIds.length === 0) return [];

    const versions = await prisma.brandStrategyVersion.findMany({
      where: { id: { in: versionIds }, selectedIndex: { not: null } },
    });
    return versions.map((v) => {
      const data = v.data as unknown as BrandStrategyData;
      return {
        industry: data.brandKnowledge.industry ?? "",
        preferredColor: data.brandKnowledge.preferredColor ?? "",
        typographyDirection: data.brandKnowledge.typographyDirection ?? "",
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
