import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { projectsContainer } from "@/modules/projects/container";

const bodySchema = z.object({ sharedWithTeam: z.boolean() });

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const project = await projectsContainer.shareProjectWithTeamUseCase.execute({
      projectId: id,
      userId: session.sub,
      sharedWithTeam: parsed.data.sharedWithTeam,
    });

    return apiSuccess({ project });
  } catch (err) {
    return toApiError(err);
  }
}
