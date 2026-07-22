import { requireSessionOrRedirect } from "@/shared/auth/session";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { projectsContainer } from "@/modules/projects/container";
import { MockupStudioView } from "@/features/mockups/MockupStudioView";

export default async function MockupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSessionOrRedirect();
  const { id } = await params;
  const [subscription, project] = await Promise.all([
    subscriptionsContainer.getSubscriptionUseCase.execute({ userId: session.sub }),
    projectsContainer.getProjectUseCase.execute({ projectId: id, userId: session.sub }),
  ]);

  return <MockupStudioView projectId={id} planCode={subscription.planCode} deliverableType={project.deliverableType} />;
}
