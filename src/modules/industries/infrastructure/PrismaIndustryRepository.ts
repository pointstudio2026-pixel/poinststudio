import { prisma } from "@/shared/database/prisma";
import type { IndustryRepository } from "@/modules/industries/domain/IndustryRepository";
import type { CreateIndustryInput, Industry, UpdateIndustryInput } from "@/modules/industries/domain/Industry";
import type { Industry as PrismaIndustryRow } from "../../../../generated/prisma/client";

function toIndustry(row: PrismaIndustryRow): Industry {
  return {
    id: row.id,
    name: row.name,
    seoSlug: row.seoSlug,
    category: row.category,
    description: row.description,
    recommendedColors: row.recommendedColors,
    recommendedLogoStyles: row.recommendedLogoStyles,
    recommendedTypography: row.recommendedTypography,
    recommendedPersonality: row.recommendedPersonality,
    recommendedKeywords: row.recommendedKeywords,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaIndustryRepository implements IndustryRepository {
  async listActive(): Promise<Industry[]> {
    const rows = await prisma.industry.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
    return rows.map(toIndustry);
  }

  async search(query: string): Promise<Industry[]> {
    const trimmed = query.trim();
    if (!trimmed) return this.listActive();
    const words = trimmed.split(/\s+/).filter(Boolean);
    const rows = await prisma.industry.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { description: { contains: trimmed, mode: "insensitive" } },
          { recommendedKeywords: { has: trimmed } },
          { recommendedKeywords: { hasSome: words } },
        ],
      },
      orderBy: { name: "asc" },
    });
    return rows.map(toIndustry);
  }

  async findByName(name: string): Promise<Industry | null> {
    const row = await prisma.industry.findUnique({ where: { name } });
    return row ? toIndustry(row) : null;
  }

  async findById(id: string): Promise<Industry | null> {
    const row = await prisma.industry.findUnique({ where: { id } });
    return row ? toIndustry(row) : null;
  }

  async listAll(): Promise<Industry[]> {
    const rows = await prisma.industry.findMany({ orderBy: { name: "asc" } });
    return rows.map(toIndustry);
  }

  async create(input: CreateIndustryInput): Promise<Industry> {
    const row = await prisma.industry.create({
      data: {
        name: input.name,
        seoSlug: input.seoSlug,
        category: input.category,
        description: input.description,
        recommendedColors: input.recommendedColors,
        recommendedLogoStyles: input.recommendedLogoStyles,
        recommendedTypography: input.recommendedTypography,
        recommendedPersonality: input.recommendedPersonality,
        recommendedKeywords: input.recommendedKeywords,
        isActive: input.isActive ?? true,
      },
    });
    return toIndustry(row);
  }

  async update(id: string, input: UpdateIndustryInput): Promise<Industry> {
    const row = await prisma.industry.update({ where: { id }, data: input });
    return toIndustry(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.industry.delete({ where: { id } });
  }
}
