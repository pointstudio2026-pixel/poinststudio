import { requireSessionOrRedirect } from "@/shared/auth/session";
import { BrandBriefView } from "@/features/brandBrief/BrandBriefView";

export default async function BrandBriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSessionOrRedirect();
  const { id } = await params;

  return <BrandBriefView projectId={id} />;
}
