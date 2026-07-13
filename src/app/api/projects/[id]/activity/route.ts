import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { projectsContainer } from "@/modules/projects/container";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = requireUser(request);
    const { id } = await params;
    const activity = await projectsContainer.getProjectActivityUseCase.execute({
      projectId: id,
      userId: session.sub,
    });
    return apiSuccess({ activity });
  } catch (err) {
    return toApiError(err);
  }
}
