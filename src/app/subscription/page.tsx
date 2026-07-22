import { requireSessionOrRedirect } from "@/shared/auth/session";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { SubscriptionView } from "@/features/subscription/SubscriptionView";

// Task-023(Payment Integration)에서 "업그레이드" 버튼이 실제 결제로
// 연결된다. 지금은 플랜 비교와 결제 수단 선택 UI까지만 제공한다
// (19_PRD_Subscription.md: "제외 - 실제 PG 결제 연동").
export default async function SubscriptionPage() {
  const session = await requireSessionOrRedirect();
  const subscription = await subscriptionsContainer.getSubscriptionUseCase.execute({
    userId: session.sub,
  });
  const plans = subscriptionsContainer.getPlansUseCase.execute();

  return <SubscriptionView currentPlanCode={subscription.planCode} plans={plans} />;
}
