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
}): MockupTemplate {
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
}
