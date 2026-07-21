import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { projectsContainer } from "@/modules/projects/container";

const bodySchema = z.object({ deliverableType: z.string().min(1) });

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

    const project = await projectsContainer.selectDeliverableTypeUseCase.execute({
      projectId: id,
      userId: session.sub,
      deliverableType: parsed.data.deliverableType,
    });

    return apiSuccess({ project }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
