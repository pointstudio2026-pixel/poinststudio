import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { updateProjectSchema } from "@/modules/projects/schemas/project.schemas";
import { projectsContainer } from "@/modules/projects/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id } = await params;
    const project = await projectsContainer.getProjectUseCase.execute({
      projectId: id,
      userId: session.sub,
    });
    return apiSuccess({ project });
  } catch (err) {
    return toApiError(err);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const project = await projectsContainer.updateProjectUseCase.execute({
      projectId: id,
      userId: session.sub,
      ...parsed.data,
    });

    return apiSuccess({ project });
  } catch (err) {
    return toApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id } = await params;
    await projectsContainer.deleteProjectUseCase.execute({
      projectId: id,
      userId: session.sub,
    });
    return apiSuccess({ deleted: true });
  } catch (err) {
    return toApiError(err);
  }
}
