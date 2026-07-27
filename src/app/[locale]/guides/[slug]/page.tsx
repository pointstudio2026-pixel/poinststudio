import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleDetailView } from "@/features/landingArticles/ArticleDetailView";
import { landingArticlesContainer } from "@/modules/landingArticles/container";
import { NotFoundError } from "@/shared/errors/AppError";
import { BASE_URL } from "@/shared/seo/baseUrl";

// force-dynamic 필수 -- src/app/guides/page.tsx의 주석 참고. 빌드 시점
// 프리렌더 시도가 DB/큐 연결을 트리거해서 빌드 자체가 죽는 걸 막는다.
export const dynamic = "force-dynamic";

const NON_KO_LOCALES = ["en", "ja", "fr", "de"] as const;
type NonKoLocale = (typeof NON_KO_LOCALES)[number];

function isNonKoLocale(value: string): value is NonKoLocale {
  return (NON_KO_LOCALES as readonly string[]).includes(value);
}

function buildAlternates(slug: string) {
  return {
    ko: `${BASE_URL}/guides/${slug}`,
    en: `${BASE_URL}/en/guides/${slug}`,
    ja: `${BASE_URL}/ja/guides/${slug}`,
    fr: `${BASE_URL}/fr/guides/${slug}`,
    de: `${BASE_URL}/de/guides/${slug}`,
    "x-default": `${BASE_URL}/guides/${slug}`,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isNonKoLocale(locale)) return {};

  const article = await landingArticlesContainer.getLandingArticleUseCase.execute({ slug, locale }).catch(() => null);
  if (!article) return {};

  return {
    title: article.title,
    description: article.metaDescription,
    alternates: { languages: buildAlternates(slug) },
  };
}

export default async function LocalizedGuideDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isNonKoLocale(locale)) {
    notFound();
  }

  let article;
  try {
    article = await landingArticlesContainer.getLandingArticleUseCase.execute({ slug, locale });
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound();
    }
    throw err;
  }

  return <ArticleDetailView locale={locale} article={article} />;
}
