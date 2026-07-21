import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { userStylesContainer } from "@/modules/userStyles/container";

const bodySchema = z.object({ userStyleCategoryId: z.string().min(1) });

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

    const selection = await userStylesContainer.selectProjectUserStyleUseCase.execute({
      projectId: id,
      userId: session.sub,
      userStyleCategoryId: parsed.data.userStyleCategoryId,
    });

    return apiSuccess({ selection }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
