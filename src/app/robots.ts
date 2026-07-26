import type { MetadataRoute } from "next";

const BASE_URL = "https://www.designaster.com";

// 로그인 뒤 개인 작업 공간(/projects/*)과 관리자 전용 화면은 검색엔진이
// 색인할 이유가 없어 막는다. API 라우트도 마찬가지. 그 외 공개 마케팅
// 페이지는 전부 허용.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/projects/", "/ops-portal-7x2q/", "/oauth/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
