import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { changePasswordSchema } from "@/modules/auth/schemas/auth.schemas";
import { authContainer } from "@/modules/auth/container";

export async function PATCH(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    await authContainer.changePasswordUseCase.execute({
      userId: session.sub,
      ...parsed.data,
    });

    return apiSuccess({ ok: true });
  } catch (err) {
    return toApiError(err);
  }
}
