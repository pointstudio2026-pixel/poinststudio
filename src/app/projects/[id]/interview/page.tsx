import { requireSessionOrRedirect } from "@/shared/auth/session";
import { InterviewView } from "@/features/interview/InterviewView";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSessionOrRedirect();
  const { id } = await params;

  return <InterviewView projectId={id} />;
}
