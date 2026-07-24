export type PlanCode = "free" | "pro" | "studio";

/** The only usage event type this task enforces a limit against so far. */
export const GENERATION_EVENT_TYPE = "image_generation";
/** Tracked for analytics/usage history, not quota-gated (Export Center's plan effect is the watermark, not a hard limit). */
export const EXPORT_EVENT_TYPE = "export";

export interface PlanLimits {
  monthlyGenerationLimit: number;
  maxResolution: "standard" | "high";
  priorityQueue: boolean;
}

/**
 * 2026-07-24 개정: 생성 1회당 전체 비용(gpt-image-2 $0.053 + Vision AI 평가
 * $0.002~0.004 + 인프라/결제수수료 등 간접비 추정치 포함 ≈ ₩100)을 기준으로
 * 원가율 약 40%가 되도록 재산정 -- 이전 값(Pro 80/Studio 300, 원가율
 * ~27%/~30%)은 마진에 여유가 있어 사용자 체감 한도를 더 넉넉하게 올렸다.
 * Pro/Studio의 정확한 횟수는 마케팅 페이지(랜딩/구독 페이지)에 공개하지
 * 않고 "넉넉한 생성 횟수" 같은 문구로만 노출한다(Free만 정확한 숫자를 그대로
 * 보여줌). 실제 사용량 대시보드(UsageWidget)는 이미 구독 중인 사용자 본인의
 * 계정 관리용이라 예외로 정확한 숫자를 계속 보여준다.
 */
export const PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  free: { monthlyGenerationLimit: 10, maxResolution: "standard", priorityQueue: false },
  pro: { monthlyGenerationLimit: 120, maxResolution: "high", priorityQueue: true },
  studio: { monthlyGenerationLimit: 400, maxResolution: "high", priorityQueue: true },
};
