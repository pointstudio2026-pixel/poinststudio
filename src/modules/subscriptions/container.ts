import { PrismaSubscriptionRepository } from "@/modules/subscriptions/infrastructure/PrismaSubscriptionRepository";
import { PrismaUsageRepository } from "@/modules/subscriptions/infrastructure/PrismaUsageRepository";
import { GetSubscriptionUseCase } from "@/modules/subscriptions/application/GetSubscriptionUseCase";
import { CheckPlanUseCase } from "@/modules/subscriptions/application/CheckPlanUseCase";
import { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import { GetUsageSummaryUseCase } from "@/modules/subscriptions/application/GetUsageSummaryUseCase";
import { GetPlansUseCase } from "@/modules/subscriptions/application/GetPlansUseCase";

export const subscriptionRepository = new PrismaSubscriptionRepository();
const usageRepository = new PrismaUsageRepository();

export const subscriptionsContainer = {
  getSubscriptionUseCase: new GetSubscriptionUseCase(subscriptionRepository),
  checkPlanUseCase: new CheckPlanUseCase(subscriptionRepository, usageRepository),
  recordUsageUseCase: new RecordUsageUseCase(usageRepository),
  getUsageSummaryUseCase: new GetUsageSummaryUseCase(subscriptionRepository, usageRepository),
  getPlansUseCase: new GetPlansUseCase(),
};
