import { requireSessionOrRedirect } from "@/shared/auth/session";
import { ExportCenterView } from "@/features/exports/ExportCenterView";

export default async function ExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSessionOrRedirect();
  const { id } = await params;

  return <ExportCenterView projectId={id} />;
}
