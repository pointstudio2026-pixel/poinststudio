import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import type { Locale } from "@/shared/i18n/locale";

/**
 * 한국어(ko)는 원화, 그 외 모든 로케일은 달러로 표시한다. 아직 정식 결제
 * 연동 전 마케팅 페이지 표기값이라 정확한 환율 변환이 아니라 통상적인
 * SaaS 가격대에 맞춘 값(₩29,000/₩99,000 ≈ $19/$69)을 쓴다.
 */
const PLAN_PRICES_KRW: Record<PlanCode, string> = { free: "₩0", pro: "₩29,000", studio: "₩99,000" };
const PLAN_PRICES_USD: Record<PlanCode, string> = { free: "$0", pro: "$19", studio: "$69" };

export function getPlanPrice(planCode: PlanCode, locale: Locale): string {
  return locale === "ko" ? PLAN_PRICES_KRW[planCode] : PLAN_PRICES_USD[planCode];
}
