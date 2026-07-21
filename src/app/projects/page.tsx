import { requireSessionOrRedirect } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { ProjectsView } from "@/features/projects/ProjectsView";

export default async function ProjectsPage() {
  const session = await requireSessionOrRedirect();
  const user = await authContainer.getMeUseCase.execute({ userId: session.sub });

  return <ProjectsView email={user.email} name={user.name} emailVerified={user.emailVerified} />;
}
