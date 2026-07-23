import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { logoStylesContainer } from "@/modules/logoStyles/container";

const bodySchema = z.object({
  projectId: z.string().min(1),
  categoryIds: z.array(z.string().min(1)).min(1),
  forbiddenCategoryIds: z.array(z.string().min(1)).default([]),
});

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const selection = await logoStylesContainer.selectLogoStyleUseCase.execute({
      projectId: parsed.data.projectId,
      userId: session.sub,
      categoryIds: parsed.data.categoryIds,
      forbiddenCategoryIds: parsed.data.forbiddenCategoryIds,
    });

    return apiSuccess({ selection }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
