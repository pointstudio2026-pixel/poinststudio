import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { projectLogosContainer } from "@/modules/projectLogos/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const bodySchema = z.object({
  choice: z.enum(["upload", "skip"]),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const project = await projectLogosContainer.selectLogoChoiceUseCase.execute({
      userId: session.sub,
      projectId: id,
      choice: parsed.data.choice,
    });

    return apiSuccess({ project }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
