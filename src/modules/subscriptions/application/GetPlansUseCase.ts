import { PLAN_LIMITS, type PlanCode, type PlanLimits } from "@/modules/subscriptions/domain/planLimits";

export class GetPlansUseCase {
  execute(): Array<{ planCode: PlanCode } & PlanLimits> {
    return (Object.keys(PLAN_LIMITS) as PlanCode[]).map((planCode) => ({
      planCode,
      ...PLAN_LIMITS[planCode],
    }));
  }
}
