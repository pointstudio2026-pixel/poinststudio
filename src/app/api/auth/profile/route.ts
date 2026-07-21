import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { updateProfileSchema } from "@/modules/auth/schemas/auth.schemas";
import { authContainer } from "@/modules/auth/container";

export async function PATCH(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const user = await authContainer.updateProfileUseCase.execute({
      userId: session.sub,
      ...parsed.data,
    });

    return apiSuccess({ user });
  } catch (err) {
    return toApiError(err);
  }
}
