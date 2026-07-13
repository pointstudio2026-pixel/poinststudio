import { requireSessionOrRedirect } from "@/shared/auth/session";
import { DesignMemoryView } from "@/features/designMemory/DesignMemoryView";

export default async function DesignMemoryPage() {
  await requireSessionOrRedirect();

  return <DesignMemoryView />;
}
