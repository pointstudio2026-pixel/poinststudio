import { requireSessionOrRedirect } from "@/shared/auth/session";
import { StylesView } from "@/features/styles/StylesView";

export default async function StylesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSessionOrRedirect();
  const { id } = await params;

  return <StylesView projectId={id} />;
}
