import { projectsContainer } from "@/modules/projects/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { GetDashboardUseCase } from "@/modules/dashboard/application/GetDashboardUseCase";

export const dashboardContainer = {
  getDashboardUseCase: new GetDashboardUseCase(
    projectsContainer.listProjectsUseCase,
    subscriptionsContainer.getSubscriptionUseCase,
    subscriptionsContainer.getUsageSummaryUseCase,
  ),
};
