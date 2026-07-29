import { prisma } from "@/shared/database/prisma";
import type { MockupCategory, MockupTemplate } from "@/modules/mockups/domain/Mockup";
import type { MockupTemplateRepository } from "@/modules/mockups/domain/MockupTemplateRepository";
import type { Locale } from "@/shared/i18n/locale";

/** locale이 "ko"가 아니면 배경 사진에 한글이 박힌 템플릿을 걸러낸다 -- 한국어
 * 사용자는 한글+영어 둘 다, 그 외 언어 사용자는 영어(한글 없는) 템플릿만. */
function koreanTextFilter(locale?: Locale) {
  return locale && locale !== "ko" ? { containsKoreanText: false } : {};
}

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
  async list(category?: MockupCategory, locale?: Locale): Promise<MockupTemplate[]> {
    const rows = await prisma.mockupTemplate.findMany({
      where: { ...(category ? { category } : {}), ...koreanTextFilter(locale) },
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

  async search(query: string, locale?: Locale): Promise<MockupTemplate[]> {
    const trimmed = query.trim();
    if (!trimmed) return this.list(undefined, locale);
    // "병원 유니폼"처럼 여러 단어로 검색해도 각 단어가 keywords 배열의
    // 원소 하나와 정확히 일치하면 매칭되도록 단어 단위로도 함께 본다
    // (keywords는 짧은 단일/복합 명사 시소러스라 "has"는 정확히 일치해야
    // 하므로, contains 기반인 name/description과 달리 부분 문자열 매칭이
    // 안 된다 -- 이걸 보완).
    const words = trimmed.split(/\s+/).filter(Boolean);
    const rows = await prisma.mockupTemplate.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: trimmed, mode: "insensitive" } },
              { description: { contains: trimmed, mode: "insensitive" } },
              { keywords: { has: trimmed } },
              { keywords: { hasSome: words } },
            ],
          },
          koreanTextFilter(locale),
        ],
      },
      orderBy: { name: "asc" },
    });
    return rows.map(toTemplate);
  }
}
