import { notFound } from "next/navigation";
import { ArticleHubView } from "@/features/landingArticles/ArticleHubView";

const NON_KO_LOCALES = ["en", "ja", "fr", "de"] as const;
type NonKoLocale = (typeof NON_KO_LOCALES)[number];

function isNonKoLocale(value: string): value is NonKoLocale {
  return (NON_KO_LOCALES as readonly string[]).includes(value);
}

// 비한국어 존 -- [locale] 동적 세그먼트가 관계없는 경로까지 삼키지 않도록
// 지원하는 4개 언어만 통과시키고, 그 외에는 notFound()로 막는다.
//
// force-dynamic 필수 -- src/app/guides/page.tsx의 주석 참고. 빌드 시점
// 프리렌더 시도가 DB/큐 연결을 트리거해서 빌드 자체가 죽는 걸 막는다.
export const dynamic = "force-dynamic";
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
