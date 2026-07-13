import { requireSessionOrRedirect } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { DashboardView } from "@/features/dashboard/DashboardView";

export default async function DashboardPage() {
  const session = await requireSessionOrRedirect();
  const user = await authContainer.getMeUseCase.execute({ userId: session.sub });

  return <DashboardView email={user.email} />;
}
