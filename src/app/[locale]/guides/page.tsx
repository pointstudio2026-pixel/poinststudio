import { notFound } from "next/navigation";
import { ArticleHubView } from "@/features/landingArticles/ArticleHubView";

const NON_KO_LOCALES = ["en", "ja", "fr", "de"] as const;
type NonKoLocale = (typeof NON_KO_LOCALES)[number];

function isNonKoLocale(value: string): value is NonKoLocale {
  return (NON_KO_LOCALES as readonly string[]).includes(value);
}

// 비한국어 존 -- [locale] 동적 세그먼트가 관계없는 경로까지 삼키지 않도록
// 지원하는 4개 언어만 통과시키고, 그 외에는 notFound()로 막는다.
export default async function LocalizedGuidesHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  if (!isNonKoLocale(locale)) {
    notFound();
  }

  const { category } = await searchParams;
  return <ArticleHubView locale={locale} category={category} />;
}
