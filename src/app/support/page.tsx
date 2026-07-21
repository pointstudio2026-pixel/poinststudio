import { requireSessionOrRedirect } from "@/shared/auth/session";
import { SupportView } from "@/features/support/SupportView";

export default async function SupportPage() {
  await requireSessionOrRedirect();

  return <SupportView />;
}
