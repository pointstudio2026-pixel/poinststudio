import { prisma } from "@/shared/database/prisma";
import type { MockupCategory, MockupTemplate } from "@/modules/mockups/domain/Mockup";
import type { MockupTemplateRepository } from "@/modules/mockups/domain/MockupTemplateRepository";

function toTemplate(row: {
  id: string;
  category: string;
  name: string;
  slug: string;
  description: string;
  backgroundUrl: string;
  placementXPct: number;
  placementYPct: number;
  placementWidthPct: number;
  placementHeightPct: number;
  fullDesignPlacementXPct: number | null;
  fullDesignPlacementYPct: number | null;
  fullDesignPlacementWidthPct: number | null;
  fullDesignPlacementHeightPct: number | null;
  keywords: string[];
}): MockupTemplate {
  const hasFullDesignArea =
    row.fullDesignPlacementXPct != null &&
    row.fullDesignPlacementYPct != null &&
    row.fullDesignPlacementWidthPct != null &&
    row.fullDesignPlacementHeightPct != null;

  return {
    id: row.id,
    category: row.category as MockupCategory,
    name: row.name,
    slug: row.slug,
    description: row.description,
    backgroundUrl: row.backgroundUrl,
    placementArea: {
      xPct: row.placementXPct,
      yPct: row.placementYPct,
      widthPct: row.placementWidthPct,
      heightPct: row.placementHeightPct,
    },
    fullDesignPlacementArea: hasFullDesignArea
      ? {
          xPct: row.fullDesignPlacementXPct!,
          yPct: row.fullDesignPlacementYPct!,
          widthPct: row.fullDesignPlacementWidthPct!,
          heightPct: row.fullDesignPlacementHeightPct!,
        }
      : null,
    keywords: row.keywords,
  };
}

export class PrismaMockupTemplateRepository implements MockupTemplateRepository {
  async list(category?: MockupCategory): Promise<MockupTemplate[]> {
    const rows = await prisma.mockupTemplate.findMany({
      where: category ? { category } : undefined,
      orderBy: { name: "asc" },
    });
    return rows.map(toTemplate);
  }

  async findById(id: string): Promise<MockupTemplate | null> {
    const row = await prisma.mockupTemplate.findUnique({ where: { id } });
    return row ? toTemplate(row) : null;
  }

  async listCategories(): Promise<MockupCategory[]> {
    const rows = await prisma.mockupTemplate.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    return rows.map((r) => r.category as MockupCategory);
  }

  async search(query: string): Promise<MockupTemplate[]> {
    const trimmed = query.trim();
    if (!trimmed) return this.list();
    const rows = await prisma.mockupTemplate.findMany({
      where: {
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { description: { contains: trimmed, mode: "insensitive" } },
          { keywords: { has: trimmed } },
        ],
      },
      orderBy: { name: "asc" },
    });
    return rows.map(toTemplate);
  }
}
