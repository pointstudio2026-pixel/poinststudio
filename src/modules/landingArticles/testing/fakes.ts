import type {
  LandingArticleRepository,
  ListLandingArticlesParams,
  UpsertLandingArticleTranslationInput,
} from "@/modules/landingArticles/domain/LandingArticleRepository";
import type { LandingArticle } from "@/modules/landingArticles/domain/LandingArticle";

interface StoredGroup {
  id: string;
  slug: string;
  category: string;
}

interface StoredTranslation {
  groupId: string;
  locale: string;
  title: string;
  displayTitle: string;
  metaDescription: string;
  content: LandingArticle["content"];
  status: LandingArticle["status"];
  publishedAt: Date | null;
}

export class FakeLandingArticleRepository implements LandingArticleRepository {
  groups: StoredGroup[] = [];
  translations: StoredTranslation[] = [];

  async upsertTranslation(input: UpsertLandingArticleTranslationInput): Promise<LandingArticle> {
    let group = this.groups.find((g) => g.slug === input.slug);
    if (!group) {
      group = { id: `group-${this.groups.length + 1}`, slug: input.slug, category: input.category };
      this.groups.push(group);
    }

    let translation = this.translations.find((t) => t.groupId === group!.id && t.locale === input.locale);
    const publishedAt =
      input.status === "published" ? (translation?.publishedAt ?? new Date()) : (translation?.publishedAt ?? null);

    if (!translation) {
      translation = {
        groupId: group.id,
        locale: input.locale,
        title: input.title,
        displayTitle: input.displayTitle,
        metaDescription: input.metaDescription,
        content: input.content,
        status: input.status,
        publishedAt,
      };
      this.translations.push(translation);
    } else {
      translation.title = input.title;
      translation.displayTitle = input.displayTitle;
      translation.metaDescription = input.metaDescription;
      translation.content = input.content;
      translation.status = input.status;
      translation.publishedAt = publishedAt;
    }

    return {
      slug: group.slug,
      category: group.category,
      locale: translation.locale,
      title: translation.title,
      displayTitle: translation.displayTitle,
      metaDescription: translation.metaDescription,
      content: translation.content,
      status: translation.status,
      publishedAt: translation.publishedAt,
    };
  }

  async findBySlugAndLocale(slug: string, locale: string): Promise<LandingArticle | null> {
    const group = this.groups.find((g) => g.slug === slug);
    if (!group) return null;

    const translation = this.translations.find(
      (t) => t.groupId === group.id && t.locale === locale && t.status === "published",
    );
    if (!translation) return null;

    return {
      slug: group.slug,
      category: group.category,
      locale: translation.locale,
      title: translation.title,
      displayTitle: translation.displayTitle,
      metaDescription: translation.metaDescription,
      content: translation.content,
      status: translation.status,
      publishedAt: translation.publishedAt,
    };
  }

  async findPublishedLocales(slug: string): Promise<string[]> {
    const group = this.groups.find((g) => g.slug === slug);
    if (!group) return [];
    return this.translations
      .filter((t) => t.groupId === group.id && t.status === "published")
      .map((t) => t.locale);
  }

  async listPublished(params: ListLandingArticlesParams): Promise<LandingArticle[]> {
    return this.translations
      .filter((t) => t.locale === params.locale && t.status === "published")
      .map((t) => {
        const group = this.groups.find((g) => g.id === t.groupId)!;
        return { group, t };
      })
      .filter(({ group }) => !params.category || group.category === params.category)
      .sort((a, b) => (b.t.publishedAt?.getTime() ?? 0) - (a.t.publishedAt?.getTime() ?? 0))
      .map(({ group, t }) => ({
        slug: group.slug,
        category: group.category,
        locale: t.locale,
        title: t.title,
        displayTitle: t.displayTitle,
        metaDescription: t.metaDescription,
        content: t.content,
        status: t.status,
        publishedAt: t.publishedAt,
      }));
  }

  async searchPublished(locale: string, query: string): Promise<LandingArticle[]> {
    const needle = query.toLowerCase();
    return this.translations
      .filter(
        (t) =>
          t.locale === locale &&
          t.status === "published" &&
          (t.title.toLowerCase().includes(needle) ||
            t.displayTitle.toLowerCase().includes(needle) ||
            t.metaDescription.toLowerCase().includes(needle)),
      )
      .map((t) => {
        const group = this.groups.find((g) => g.id === t.groupId)!;
        return { group, t };
      })
      .sort((a, b) => (b.t.publishedAt?.getTime() ?? 0) - (a.t.publishedAt?.getTime() ?? 0))
      .map(({ group, t }) => ({
        slug: group.slug,
        category: group.category,
        locale: t.locale,
        title: t.title,
        displayTitle: t.displayTitle,
        metaDescription: t.metaDescription,
        content: t.content,
        status: t.status,
        publishedAt: t.publishedAt,
      }));
  }
}
