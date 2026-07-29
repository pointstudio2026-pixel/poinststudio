import { prisma } from "@/shared/database/prisma";
import type { IndustryRepository } from "@/modules/industries/domain/IndustryRepository";
import type { CreateIndustryInput, Industry, UpdateIndustryInput } from "@/modules/industries/domain/Industry";
import type {
  Industry as PrismaIndustryRow,
  IndustryTranslation as PrismaIndustryTranslationRow,
} from "../../../../generated/prisma/client";
import type { Locale } from "@/shared/i18n/locale";

type IndustryRowWithTranslations = PrismaIndustryRow & { translations?: PrismaIndustryTranslationRow[] };

function toIndustry(row: IndustryRowWithTranslations, locale: Locale = "ko"): Industry {
  const translation = locale !== "ko" ? row.translations?.find((t) => t.locale === locale) : undefined;
  return {
    id: row.id,
    name: row.name,
    displayName: translation?.name ?? row.name,
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

/** Levenshtein 거리 임계값 -- 너무 짧은 검색어(1~2자)는 유사매칭을 끄고
 * (노이즈가 너무 커짐), 3~5자는 1글자, 6자 이상은 2글자까지 오차를 허용한다.
 * "바베큐" vs "바비큐" 같은 한 글자 표기 변형을 정확히 잡아내기 위한 값이다. */
function fuzzyThreshold(term: string): number {
  if (term.length <= 2) return 0;
  if (term.length <= 5) return 1;
  return 2;
}

export class PrismaIndustryRepository implements IndustryRepository {
  async listActive(locale: Locale = "ko"): Promise<Industry[]> {
    const rows = await prisma.industry.findMany({
      where: { isActive: true },
      include: locale === "ko" ? undefined : { translations: { where: { locale } } },
      orderBy: { name: "asc" },
    });
    return rows.map((row) => toIndustry(row, locale));
  }

  async search(query: string, locale: Locale = "ko"): Promise<Industry[]> {
    const trimmed = query.trim();
    if (!trimmed) return this.listActive(locale);

    const threshold = fuzzyThreshold(trimmed);

    const matched =
      locale === "ko"
        ? await prisma.$queryRaw<{ id: string }[]>`
            SELECT DISTINCT i.id
            FROM industries i
            LEFT JOIN LATERAL unnest(i.recommended_keywords || ARRAY[i.name]) AS kw(term) ON true
            WHERE i.is_active = true
              AND (
                i.name ILIKE '%' || ${trimmed} || '%'
                OR i.description ILIKE '%' || ${trimmed} || '%'
                OR (
                  ${threshold}::int > 0
                  AND levenshtein(lower(kw.term), lower(${trimmed})) <= ${threshold}
                  AND abs(length(kw.term) - length(${trimmed})) <= 2
                )
              )
          `
        : await prisma.$queryRaw<{ id: string }[]>`
            SELECT DISTINCT t.industry_id AS id
            FROM industry_translations t
            INNER JOIN industries i ON i.id = t.industry_id AND i.is_active = true
            LEFT JOIN LATERAL unnest(t.search_keywords || ARRAY[t.name]) AS kw(term) ON true
            WHERE t.locale = ${locale}
              AND (
                t.name ILIKE '%' || ${trimmed} || '%'
                OR (
                  ${threshold}::int > 0
                  AND levenshtein(lower(kw.term), lower(${trimmed})) <= ${threshold}
                  AND abs(length(kw.term) - length(${trimmed})) <= 2
                )
              )
          `;

    if (matched.length === 0) return [];
    const ids = matched.map((r) => r.id);
    const rows = await prisma.industry.findMany({
      where: { id: { in: ids } },
      include: locale === "ko" ? undefined : { translations: { where: { locale } } },
      orderBy: { name: "asc" },
    });
    return rows.map((row) => toIndustry(row, locale));
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
    return rows.map((row) => toIndustry(row));
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
