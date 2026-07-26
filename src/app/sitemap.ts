import type { MetadataRoute } from "next";

const BASE_URL = "https://www.designaster.com";

// 로그인 뒤에만 볼 수 있는 화면(프로젝트/관리자 등)은 검색엔진이 크롤링해도
// 의미가 없으므로 제외하고, 실제 마케팅/정보성 공개 페이지만 등록한다.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/guide`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
