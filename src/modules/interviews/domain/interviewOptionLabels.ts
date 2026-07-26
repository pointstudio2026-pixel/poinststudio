import type { Locale } from "@/shared/i18n/locale";
import { MESSAGES } from "@/shared/i18n/messages";
import type { MessageKey } from "@/shared/i18n/messages/types";

/**
 * interviewQuestions.ts의 INDUSTRY_OPTIONS/PURPOSE_OPTIONS/TARGET_AUDIENCE_OPTIONS/
 * DESIRED_IMPRESSION_OPTIONS는 answers[key]에 그대로 저장되는 원문(한국어)이고,
 * 브랜드 전략(brandKnowledgeRules/asterBrainRules) · Concept Board
 * (conceptBoardComposer)가 이 원문을 문장 템플릿에 그대로 꽂아 넣던 것이 실제
 * 버그였다(영어/일본어/불어/독어 화면에도 한국어 값이 그대로 노출됨). 값 자체는
 * 절대 바꾸지 않고(answers[key] 매칭/스코어링이 원문에 의존), 문장 조립 직전에만
 * 이 표로 번역한다 -- features/interview/interviewLabels.ts의 OPTION_LABEL_KEYS와
 * 정확히 같은 ko.ts interviewOptions.* 카탈로그를 가리키는 동일한 매핑이지만,
 * 도메인 계층(modules/*)이 UI 계층(features/*)을 import하지 않도록 여기 4개
 * 그룹만 별도로 다시 선언한다.
 */
export const INDUSTRY_LABEL_KEYS: Record<string, MessageKey> = {
  "카페/커피": "interviewOptions.industry.cafe",
  "레스토랑/외식": "interviewOptions.industry.restaurant",
  "병원/의원/클리닉": "interviewOptions.industry.hospital",
  "IT/스타트업": "interviewOptions.industry.itStartup",
  "리테일/쇼핑몰": "interviewOptions.industry.retail",
  "뷰티/화장품": "interviewOptions.industry.beauty",
  "패션/의류": "interviewOptions.industry.fashion",
  교육: "interviewOptions.industry.education",
  부동산: "interviewOptions.industry.realEstate",
  "피트니스/헬스": "interviewOptions.industry.fitness",
  반려동물: "interviewOptions.industry.pet",
  "여행/숙박": "interviewOptions.industry.travel",
  금융: "interviewOptions.industry.finance",
  제조업: "interviewOptions.industry.manufacturing",
  "식품/농수산물": "interviewOptions.industry.food",
  "예술/디자인": "interviewOptions.industry.artDesign",
  컨설팅: "interviewOptions.industry.consulting",
  "비영리/공공": "interviewOptions.industry.nonprofit",
  기타: "interviewOptions.industry.other",
};

export const PURPOSE_LABEL_KEYS: Record<string, MessageKey> = {
  "신제품 출시": "interviewOptions.purpose.newProduct",
  "기존 브랜드 리뉴얼": "interviewOptions.purpose.renewal",
  "창업/오픈": "interviewOptions.purpose.startup",
  "사이드 프로젝트": "interviewOptions.purpose.sideProject",
  "포트폴리오/개인 브랜딩": "interviewOptions.purpose.portfolio",
  "사내용/비영리": "interviewOptions.purpose.internal",
};

export const TARGET_AUDIENCE_LABEL_KEYS: Record<string, MessageKey> = {
  "10대": "interviewOptions.targetAudience.teens",
  "20대": "interviewOptions.targetAudience.twenties",
  "30대": "interviewOptions.targetAudience.thirties",
  "40대": "interviewOptions.targetAudience.forties",
  "50대 이상": "interviewOptions.targetAudience.fiftyPlus",
  "전 연령대": "interviewOptions.targetAudience.allAges",
  직장인: "interviewOptions.targetAudience.officeWorker",
  학생: "interviewOptions.targetAudience.student",
  주부: "interviewOptions.targetAudience.homemaker",
  시니어: "interviewOptions.targetAudience.senior",
  전문직: "interviewOptions.targetAudience.professional",
  "사업자/자영업자": "interviewOptions.targetAudience.businessOwner",
};

export const DESIRED_IMPRESSION_LABEL_KEYS: Record<string, MessageKey> = {
  "편안하고 따뜻한 느낌": "interviewOptions.desiredImpression.warm",
  "전문적이고 신뢰감 있는 느낌": "interviewOptions.desiredImpression.professional",
  "고급스럽고 세련된 느낌": "interviewOptions.desiredImpression.premium",
  "활기차고 트렌디한 느낌": "interviewOptions.desiredImpression.trendy",
  "자연스럽고 균형 잡힌 느낌": "interviewOptions.desiredImpression.natural",
};

/**
 * 서버 도메인/애플리케이션 계층에는 LocaleProvider.tsx의 resolveDotPath(client
 * 전용, "use client")에 해당하는 공용 유틸이 없어서, 동일한 알고리즘을 여기
 * 그대로 옮겨 쓴다(React 의존성 없는 순수 함수라 서버에서도 안전).
 */
function resolveMessage(locale: Locale, key: MessageKey): string {
  const value = key.split(".").reduce<unknown>((node, segment) => {
    if (node && typeof node === "object" && segment in node) {
      return (node as Record<string, unknown>)[segment];
    }
    return undefined;
  }, MESSAGES[locale] as unknown);
  return typeof value === "string" ? value : key;
}

/**
 * 인터뷰 답변(원문 한국어, 다중 선택은 ", "로 이어붙인 문자열 --
 * promptPriority/domain/classifyInterviewInput.ts의 splitMultiSelectAnswer가
 * 쓰는 구분자와 정확히 동일)을 화면/문구 조립 직전에 번역한다. 표에 없는 값
 * (AI가 그때그때 만든 후속 질문 답변, "기타: " 자유 입력 등)은 원문 그대로
 * 반환하며 절대 던지지 않는다.
 */
export function translateAnswerValue(
  raw: string | undefined,
  table: Record<string, MessageKey>,
  locale: Locale,
): string {
  if (!raw) return "";
  return raw
    .split(", ")
    .map((part) => {
      const trimmed = part.trim();
      const key = table[trimmed];
      return key ? resolveMessage(locale, key) : trimmed;
    })
    .join(", ");
}
