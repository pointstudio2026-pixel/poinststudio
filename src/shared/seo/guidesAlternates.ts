import { BASE_URL } from "@/shared/seo/baseUrl";
import { LOCALES } from "@/shared/i18n/locale";

/**
 * /guides 아래 모든 경로(허브, 카테고리 허브, 글 상세)가 공유하는 hreflang
 * alternates 맵 생성기 -- ko는 접두어 없이, 나머지 로케일은 /{locale}
 * 접두어가 붙는 규칙(guideDetailHref/guidesHubHref와 동일 규칙)을 한
 * 곳에서만 관리한다. pathSuffix는 "/{slug}"(글 상세), ""(허브 루트),
 * "?category=x"(카테고리 허브)처럼 "/guides" 뒤에 그대로 이어붙일 조각.
 */
export function buildGuidesAlternates(pathSuffix: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    const prefix = locale === "ko" ? "" : `/${locale}`;
    languages[locale] = `${BASE_URL}${prefix}/guides${pathSuffix}`;
  }
  languages["x-default"] = `${BASE_URL}/guides${pathSuffix}`;
  return languages;
}
