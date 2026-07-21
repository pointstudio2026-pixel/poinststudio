import { requireSessionOrRedirect } from "@/shared/auth/session";
import { MyStylesView } from "@/features/userStyles/MyStylesView";

export default async function MyStylesPage() {
  await requireSessionOrRedirect();

  return <MyStylesView />;
}
