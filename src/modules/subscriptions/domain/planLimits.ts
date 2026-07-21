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
 * 실제 원가(생성 1회 ≈ 3장 ≈ $0.12) 기준으로 확정한 값 (2026-07-21). 이전
 * 잠정값(Pro 200/Studio 1000)은 헤비 유저가 한도를 다 채우면 마진이 거의
 * 없거나 마이너스가 되는 수준이라 낮췄다 -- Pro/Studio의 정확한 횟수는
 * 마케팅 페이지(랜딩/구독 페이지)에 공개하지 않고 "넉넉한 생성 횟수" 같은
 * 문구로만 노출한다(Free만 정확한 숫자를 그대로 보여줌). 실제 사용량 대시보드
 * (UsageWidget)는 이미 구독 중인 사용자 본인의 계정 관리용이라 예외로 정확한
 * 숫자를 계속 보여준다.
 */
export const PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  free: { monthlyGenerationLimit: 10, maxResolution: "standard", priorityQueue: false },
  pro: { monthlyGenerationLimit: 80, maxResolution: "high", priorityQueue: true },
  studio: { monthlyGenerationLimit: 300, maxResolution: "high", priorityQueue: true },
};
