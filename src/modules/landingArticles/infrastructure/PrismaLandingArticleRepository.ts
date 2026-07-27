import { prisma } from "@/shared/database/prisma";
import type { Prisma } from "../../../../generated/prisma/client";
import type {
  LandingArticleRepository,
  ListLandingArticlesParams,
  UpsertLandingArticleTranslationInput,
} from "@/modules/landingArticles/domain/LandingArticleRepository";
import type {
  LandingArticle,
  LandingArticleContent,
  LandingArticleStatus,
} from "@/modules/landingArticles/domain/LandingArticle";

interface GroupRow {
  slug: string;
  category: string;
}

interface TranslationRow {
  locale: string;
  title: string;
  displayTitle: string;
  metaDescription: string;
  content: unknown;
  status: LandingArticleStatus;
  publishedAt: Date | null;
}

function toDomain(group: GroupRow, translation: TranslationRow): LandingArticle {
  return {
    slug: group.slug,
    category: group.category,
    locale: translation.locale,
    title: translation.title,
    displayTitle: translation.displayTitle,
    metaDescription: translation.metaDescription,
    content: translation.content as unknown as LandingArticleContent,
    status: translation.status,
    publishedAt: translation.publishedAt,
  };
}

export class PrismaLandingArticleRepository implements LandingArticleRepository {
  async upsertTranslation(input: UpsertLandingArticleTranslationInput): Promise<LandingArticle> {
    return prisma.$transaction(async (tx) => {
      const group = await tx.landingArticleGroup.upsert({
        where: { slug: input.slug },
        create: { slug: input.slug, category: input.category },
        // category는 그룹 생성 시점에만 정해지는 속성 -- 이미 존재하는
        // 그룹을 다른 locale로 upsert할 때는 절대 건드리지 않는다.
        update: {},
      });

      const existing = await tx.landingArticleTranslation.findUnique({
        where: { groupId_locale: { groupId: group.id, locale: input.locale } },
      });

      // 이미 발행되어 publishedAt이 있으면 재발행 시에도 원래 발행일을
      // 그대로 유지한다 (내용만 수정해도 발행일이 리셋되면 안 됨).
      const publishedAt =
        input.status === "published" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null);

      const translation = await tx.landingArticleTranslation.upsert({
        where: { groupId_locale: { groupId: group.id, locale: input.locale } },
        create: {
          groupId: group.id,
          locale: input.locale,
          title: input.title,
          displayTitle: input.displayTitle,
          metaDescription: input.metaDescription,
          content: input.content as unknown as Prisma.InputJsonValue,
          status: input.status,
          publishedAt,
        },
        update: {
          title: input.title,
          displayTitle: input.displayTitle,
          metaDescription: input.metaDescription,
          content: input.content as unknown as Prisma.InputJsonValue,
          status: input.status,
          publishedAt,
        },
      });

      return toDomain(group, translation);
    });
  }

  async findBySlugAndLocale(slug: string, locale: string): Promise<LandingArticle | null> {
    const group = await prisma.landingArticleGroup.findUnique({
      where: { slug },
      include: { translations: { where: { locale, status: "published" } } },
    });
    if (!group) return null;

    const translation = group.translations[0];
    if (!translation) return null;

    return toDomain(group, translation);
  }

  async findPublishedLocales(slug: string): Promise<string[]> {
    const group = await prisma.landingArticleGroup.findUnique({
      where: { slug },
      include: { translations: { where: { status: "published" }, select: { locale: true } } },
    });
    return group?.translations.map((t) => t.locale) ?? [];
  }

  async listPublished(params: ListLandingArticlesParams): Promise<LandingArticle[]> {
    const translations = await prisma.landingArticleTranslation.findMany({
      where: {
        locale: params.locale,
        status: "published",
        group: params.category ? { category: params.category } : undefined,
      },
      include: { group: true },
      orderBy: { publishedAt: "desc" },
    });

    return translations.map((translation) => toDomain(translation.group, translation));
  }

  async searchPublished(locale: string, query: string): Promise<LandingArticle[]> {
    const translations = await prisma.landingArticleTranslation.findMany({
      where: {
        locale,
        status: "published",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { displayTitle: { contains: query, mode: "insensitive" } },
          { metaDescription: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { group: true },
      orderBy: { publishedAt: "desc" },
    });

    return translations.map((translation) => toDomain(translation.group, translation));
  }
}
