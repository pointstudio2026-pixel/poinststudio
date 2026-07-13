import { notFound } from "next/navigation";
import { requireSessionOrRedirect } from "@/shared/auth/session";
import { projectsContainer } from "@/modules/projects/container";
import { NotFoundError } from "@/shared/errors/AppError";
import type { Project } from "@/modules/projects/domain/Project";

async function loadProject(projectId: string, userId: string): Promise<Project> {
  try {
    return await projectsContainer.getProjectUseCase.execute({ projectId, userId });
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound();
    }
    throw err;
  }
}

// Task-006(Project Workspace)에서 실제 허브 화면(Stepper, Brand Interview
// 등)으로 대체된다. 지금은 Task-001 "프로젝트 생성 성공 시 이동" 흐름과
// 소유권 검증(다른 사용자 프로젝트 접근 불가)이 실제로 동작함을 보여주는
// placeholder.
export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSessionOrRedirect();
  const { id } = await params;
  const project = await loadProject(id, session.sub);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-8">
      <h1 className="text-xl font-semibold">{project.name}</h1>
      <p className="text-sm text-neutral-500">현재 단계: {project.currentStep}</p>
    </main>
  );
}
