import { requireSessionOrRedirect } from "@/shared/auth/session";
import { LogoStyleView } from "@/features/logoStyles/LogoStyleView";

export default async function LogoStylePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSessionOrRedirect();
  const { id } = await params;

  return <LogoStyleView projectId={id} />;
}
