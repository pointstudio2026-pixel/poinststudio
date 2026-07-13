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
 * NOTE(business decision pending): 19_PRD_Subscription.md defines the three
 * plan tiers and that limits scale Free < Pro < Studio, but does not specify
 * exact numbers or a target cost ratio breakdown per plan. These values are
 * provisional defaults so the enforcement mechanism is usable end-to-end;
 * confirm the real numbers with the user before relying on them commercially.
 */
export const PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  free: { monthlyGenerationLimit: 10, maxResolution: "standard", priorityQueue: false },
  pro: { monthlyGenerationLimit: 200, maxResolution: "high", priorityQueue: true },
  studio: { monthlyGenerationLimit: 1000, maxResolution: "high", priorityQueue: true },
};
