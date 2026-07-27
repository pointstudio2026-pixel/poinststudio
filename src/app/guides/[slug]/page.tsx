import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleDetailView } from "@/features/landingArticles/ArticleDetailView";
import { landingArticlesContainer } from "@/modules/landingArticles/container";
import { NotFoundError } from "@/shared/errors/AppError";
import { BASE_URL } from "@/shared/seo/baseUrl";

async function loadArticle(slug: string) {
  try {
    return await landingArticlesContainer.getLandingArticleUseCase.execute({ slug, locale: "ko" });
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound();
    }
    throw err;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await landingArticlesContainer.getLandingArticleUseCase.execute({ slug, locale: "ko" }).catch(() => null);
  if (!article) return {};

  return {
    title: article.title,
    description: article.metaDescription,
    alternates: {
      languages: {
        ko: `${BASE_URL}/guides/${slug}`,
        en: `${BASE_URL}/en/guides/${slug}`,
        ja: `${BASE_URL}/ja/guides/${slug}`,
        fr: `${BASE_URL}/fr/guides/${slug}`,
        de: `${BASE_URL}/de/guides/${slug}`,
        "x-default": `${BASE_URL}/guides/${slug}`,
      },
    },
  };
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await loadArticle(slug);
  return <ArticleDetailView locale="ko" article={article} />;
}
