import { requireSessionOrRedirect } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { DesignMemoryView } from "@/features/designMemory/DesignMemoryView";

export default async function DesignMemoryPage() {
  const session = await requireSessionOrRedirect();
  const user = await authContainer.getMeUseCase.execute({ userId: session.sub });
  const subscription = await subscriptionsContainer.getSubscriptionUseCase.execute({ userId: session.sub });

  return <DesignMemoryView email={user.email} name={user.name} planCode={subscription.planCode} />;
}
