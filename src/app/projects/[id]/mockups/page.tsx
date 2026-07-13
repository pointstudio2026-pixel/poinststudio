import { requireSessionOrRedirect } from "@/shared/auth/session";
import { MockupStudioView } from "@/features/mockups/MockupStudioView";

export default async function MockupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSessionOrRedirect();
  const { id } = await params;

  return <MockupStudioView projectId={id} />;
}
