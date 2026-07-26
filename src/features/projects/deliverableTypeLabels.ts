import type { MessageKey } from "@/shared/i18n/messages/types";

// DELIVERABLE_TYPE_OPTIONS의 한국어 문자열은 DB 저장값/매칭 키로 그대로
// 쓰이므로 (deliverableTypes.ts 참고) 바꾸지 않는다 -- 화면에 보여줄 때만
// 이 표로 번역 문구를 찾는다(STEP_LABEL_MESSAGE_KEYS와 동일한 패턴).
export const DELIVERABLE_TYPE_LABEL_KEYS: Record<string, MessageKey> = {
  "브랜딩 & 로고": "deliverableType.options.brandingLogo",
  포스터: "deliverableType.options.poster",
  리플렛: "deliverableType.options.leaflet",
  브로슈어: "deliverableType.options.brochure",
  명함: "deliverableType.options.businessCard",
  패키지: "deliverableType.options.packaging",
  "앱 디자인": "deliverableType.options.appDesign",
  웹사이트: "deliverableType.options.website",
};
