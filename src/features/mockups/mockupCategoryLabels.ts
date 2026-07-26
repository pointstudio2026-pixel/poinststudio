import type { MessageKey } from "@/shared/i18n/messages/types";
import type { MockupCategoryDto } from "@/services/mockups-service";

// MOCKUP_CATEGORY_LABELS(mockups-service.ts)의 key(category)는 실제
// 저장/필터링 키로 쓰이므로 바꾸지 않는다 -- 화면에 보여줄 때만 이 표로
// 번역 문구를 찾는다(DELIVERABLE_TYPE_LABEL_KEYS와 동일한 패턴).
export const MOCKUP_CATEGORY_LABEL_KEYS: Record<MockupCategoryDto, MessageKey> = {
  business_card: "mockupCategories.businessCard",
  signboard: "mockupCategories.signboard",
  mobile_app: "mockupCategories.mobileApp",
  website_hero: "mockupCategories.websiteHero",
  brochure: "mockupCategories.brochure",
  poster: "mockupCategories.poster",
  package: "mockupCategories.package",
  leaflet: "mockupCategories.leaflet",
  banner: "mockupCategories.banner",
  uniform: "mockupCategories.uniform",
};
