import { ArticleHubView } from "@/features/landingArticles/ArticleHubView";

// 한국어 존 -- 기본/무접두사 locale이므로 getServerLocale()(쿠키 기반 앱 UI
// locale)을 쓰지 않고 "ko"로 고정한다. 이 URL 자체가 언어를 결정한다.
export default async function GuidesHubPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  return <ArticleHubView locale="ko" category={category} />;
}
