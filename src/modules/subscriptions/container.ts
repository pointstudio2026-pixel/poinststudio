import { PrismaSubscriptionRepository } from "@/modules/subscriptions/infrastructure/PrismaSubscriptionRepository";
import { PrismaUsageRepository } from "@/modules/subscriptions/infrastructure/PrismaUsageRepository";
import { GetSubscriptionUseCase } from "@/modules/subscriptions/application/GetSubscriptionUseCase";
import { CheckPlanUseCase } from "@/modules/subscriptions/application/CheckPlanUseCase";
import { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import { GetUsageSummaryUseCase } from "@/modules/subscriptions/application/GetUsageSummaryUseCase";
import { GetPlansUseCase } from "@/modules/subscriptions/application/GetPlansUseCase";
import { UpgradePlanUseCase } from "@/modules/subscriptions/application/UpgradePlanUseCase";
import { PrismaAdminRepository } from "@/modules/admin/infrastructure/PrismaAdminRepository";

export const subscriptionRepository = new PrismaSubscriptionRepository();
const usageRepository = new PrismaUsageRepository();
// admin/container.ts가 이미 subscriptionsContainer를 참조하므로(getUsageSummaryUseCase),
// 순환 참조를 피하려고 admin/container.ts를 import하지 않고 레포지토리를 직접
// 새로 만든다 -- PrismaAdminRepository는 상태가 없는 얇은 래퍼라 중복 생성해도
// 안전하다.
const adminRepository = new PrismaAdminRepository();

export const subscriptionsContainer = {
  getSubscriptionUseCase: new GetSubscriptionUseCase(subscriptionRepository),
  checkPlanUseCase: new CheckPlanUseCase(subscriptionRepository, usageRepository),
  recordUsageUseCase: new RecordUsageUseCase(usageRepository),
  getUsageSummaryUseCase: new GetUsageSummaryUseCase(subscriptionRepository, usageRepository),
  getPlansUseCase: new GetPlansUseCase(),
  upgradePlanUseCase: new UpgradePlanUseCase(subscriptionRepository, adminRepository),
};
