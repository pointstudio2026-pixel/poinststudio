import { prisma } from "@/shared/database/prisma";
import type { LogoStyleCategory } from "@/modules/logoStyles/domain/LogoStyle";
import type { LogoStyleCategoryRepository } from "@/modules/logoStyles/domain/LogoStyleCategoryRepository";

function toCategory(row: {
  id: string;
  slug: string;
  name: string;
  description: string;
  subStyles: string[];
  keywords: string[];
  sampleImageUrl: string;
  sortOrder: number;
}): LogoStyleCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    subStyles: row.subStyles,
    keywords: row.keywords,
    sampleImageUrl: row.sampleImageUrl,
    sortOrder: row.sortOrder,
  };
}

export class PrismaLogoStyleCategoryRepository implements LogoStyleCategoryRepository {
  async listAll(): Promise<LogoStyleCategory[]> {
    const rows = await prisma.logoStyleCategory.findMany({ orderBy: { sortOrder: "asc" } });
    return rows.map(toCategory);
  }

  async findByIds(ids: string[]): Promise<LogoStyleCategory[]> {
    if (ids.length === 0) return [];
    const rows = await prisma.logoStyleCategory.findMany({ where: { id: { in: ids } } });
    return rows.map(toCategory);
  }
}
