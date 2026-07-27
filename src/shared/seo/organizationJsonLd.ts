import { BASE_URL } from "@/shared/seo/baseUrl";
import { MESSAGES } from "@/shared/i18n/messages";
import type { Locale } from "@/shared/i18n/locale";

/**
 * 사이트 전체에 한 번만 실리는 Organization 구조화 데이터(JSON-LD) --
 * 검색결과에 로고/사이트명이 더 잘 뜨도록 돕는 용도. 실제 소셜 계정
 * URL(sameAs)이 아직 없어 필드 자체를 생략한다 -- 지어내지 않는다.
 */
export function buildOrganizationJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ASTER",
    url: BASE_URL,
    logo: `${BASE_URL}/brand/aster-mark.png`,
    description: MESSAGES[locale].meta.description,
  };
}
