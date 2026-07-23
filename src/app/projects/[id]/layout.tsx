import { notFound } from "next/navigation";
import { requireSessionOrRedirect } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { projectsContainer } from "@/modules/projects/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { NotFoundError } from "@/shared/errors/AppError";
import { ProjectSidebar } from "@/features/workspace/ProjectSidebar";
import { AppHeader } from "@/features/navigation/AppHeader";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";

/**
 * Shared shell for every /projects/[id]/* route (overview, interview,
 * styles, aster-brain, generation, concept-board, mockups, export).
 * Next.js keeps this layout mounted across navigation between those
 * sibling routes -- the sidebar never unmounts/flickers, only the page
 * content below it swaps. See project_aster_workspace_layout memory for
 * the full rationale.
 */
export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const session = await requireSessionOrRedirect();
  const { id } = await params;
  const user = await authContainer.getMeUseCase.execute({ userId: session.sub });
  const subscription = await subscriptionsContainer.getSubscriptionUseCase.execute({ userId: session.sub });

  let currentStep: string;
  let deliverableType: string | null;
  try {
    const project = await projectsContainer.getProjectUseCase.execute({
      projectId: id,
      userId: session.sub,
    });
    currentStep = project.currentStep;
    deliverableType = project.deliverableType;
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader user={{ email: user.email, name: user.name }} planCode={subscription.planCode} />

      <EmailVerificationBanner emailVerified={user.emailVerified} />

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 lg:px-10">
        <ProjectSidebar
          projectId={id}
          currentStep={currentStep}
          deliverableType={deliverableType}
          planCode={subscription.planCode}
        />
        <main className="min-w-0 max-w-3xl">{children}</main>
      </div>
    </div>
  );
}
