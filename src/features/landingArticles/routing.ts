// 가이드 페이지는 두 개의 URL 존으로 나뉜다: 한국어(기본/무접두사)와
// 나머지 4개 언어(접두사 있음, /{locale}/guides/...) -- ArticleHubView/
// ArticleDetailView가 조합 링크 등을 만들 때 항상 이 헬퍼로 href를
// 만들어야 두 존에서 동일한 로직을 유지할 수 있다.
export function guidesHubHref(locale: string): string {
  return locale === "ko" ? "/guides" : `/${locale}/guides`;
}

export function guideDetailHref(locale: string, slug: string): string {
  return locale === "ko" ? `/guides/${slug}` : `/${locale}/guides/${slug}`;
}
