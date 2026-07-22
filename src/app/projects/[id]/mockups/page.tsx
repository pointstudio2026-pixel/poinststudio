import { requireSessionOrRedirect } from "@/shared/auth/session";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { MockupStudioView } from "@/features/mockups/MockupStudioView";

export default async function MockupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSessionOrRedirect();
  const { id } = await params;
  const subscription = await subscriptionsContainer.getSubscriptionUseCase.execute({ userId: session.sub });

  return <MockupStudioView projectId={id} planCode={subscription.planCode} />;
}
