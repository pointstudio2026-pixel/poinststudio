import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { createProjectSchema } from "@/modules/projects/schemas/project.schemas";
import { projectsContainer } from "@/modules/projects/container";

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const result = await projectsContainer.createProjectUseCase.execute({
      userId: session.sub,
      name: parsed.data.name,
    });

    return apiSuccess(result, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
