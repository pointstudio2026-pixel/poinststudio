import type { Metadata } from "next";
import { ArticleHubView } from "@/features/landingArticles/ArticleHubView";
import { buildGuidesHubMetadata } from "@/features/landingArticles/hubMetadata";

// 한국어 존 -- 기본/무접두사 locale이므로 getServerLocale()(쿠키 기반 앱 UI
// locale)을 쓰지 않고 "ko"로 고정한다. 이 URL 자체가 언어를 결정한다.
//
// force-dynamic 필수: 이게 없으면 Next.js가 빌드 시점에 이 페이지를 정적으로
// 미리 렌더링하려 시도하는데, 그 과정에서 실제 DB/큐 연결을 트리거해서 빌드
// 컨테이너(런타임과 네트워크가 분리됨, Redis/Postgres에 못 닿음)에서 빌드
// 자체가 죽는다("Next.js build worker exited with code: 1") -- 실제로 이
// 문제로 배포가 두 번 연속 실패한 뒤 확인된 원인.
export const dynamic = "force-dynamic";

type HubSearchParams = Promise<{ category?: string; q?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: HubSearchParams }): Promise<Metadata> {
  const { category, q } = await searchParams;
  return buildGuidesHubMetadata({ locale: "ko", category, query: q });
}

export default async function GuidesHubPage({ searchParams }: { searchParams: HubSearchParams }) {
  const { category, q } = await searchParams;
  return <ArticleHubView locale="ko" category={category} query={q} />;
}
