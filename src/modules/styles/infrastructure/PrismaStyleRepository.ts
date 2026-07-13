import { prisma } from "@/shared/database/prisma";
import type { Style } from "@/modules/styles/domain/Style";
import type { StyleListFilter, StyleRepository } from "@/modules/styles/domain/StyleRepository";

function toStyle(row: {
  id: string;
  name: string;
  slug: string;
  level: number;
  parentId: string | null;
  category: string;
  keywords: string[];
  description: string;
}): Style {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    level: row.level as 1 | 2 | 3,
    parentId: row.parentId,
    category: row.category,
    keywords: row.keywords,
    description: row.description,
  };
}

export class PrismaStyleRepository implements StyleRepository {
  async list(filter: StyleListFilter): Promise<Style[]> {
    const rows = await prisma.style.findMany({
      where: {
        ...(filter.level ? { level: filter.level } : {}),
        ...(filter.category ? { category: filter.category } : {}),
        ...(filter.search
          ? {
              OR: [
                { name: { contains: filter.search, mode: "insensitive" } },
                { keywords: { has: filter.search } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
    });
    return rows.map(toStyle);
  }

  async findById(id: string): Promise<Style | null> {
    const row = await prisma.style.findUnique({ where: { id } });
    return row ? toStyle(row) : null;
  }

  async findByIds(ids: string[]): Promise<Style[]> {
    if (ids.length === 0) return [];
    const rows = await prisma.style.findMany({ where: { id: { in: ids } } });
    return rows.map(toStyle);
  }

  async listSiblings(parentId: string, excludeId: string, limit: number): Promise<Style[]> {
    const rows = await prisma.style.findMany({
      where: { parentId, id: { not: excludeId } },
      take: limit,
      orderBy: { name: "asc" },
    });
    return rows.map(toStyle);
  }

  async listCategories(): Promise<Style[]> {
    const rows = await prisma.style.findMany({ where: { level: 1 }, orderBy: { name: "asc" } });
    return rows.map(toStyle);
  }
}
