import { redirect } from "next/navigation";
import { requireSessionOrRedirect } from "@/shared/auth/session";
import { GiftCodesView } from "@/features/admin/GiftCodesView";

export default async function GiftCodesPage() {
  const session = await requireSessionOrRedirect();
  if (session.role !== "admin") {
    redirect("/projects");
  }

  return <GiftCodesView />;
}
