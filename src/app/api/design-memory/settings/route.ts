import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { designMemoryContainer } from "@/modules/designMemory/container";

const bodySchema = z.object({ enabled: z.boolean() });

export async function PATCH(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const settings = await designMemoryContainer.updateDesignMemorySettingsUseCase.execute({
      userId: session.sub,
      enabled: parsed.data.enabled,
    });

    return apiSuccess({ settings });
  } catch (err) {
    return toApiError(err);
  }
}
