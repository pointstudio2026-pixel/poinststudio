import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { ValidationError } from "@/shared/errors/AppError";
import { authContainer } from "@/modules/auth/container";

const bodySchema = z.object({ token: z.string().min(1) });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    await authContainer.verifyEmailUseCase.execute(parsed.data);

    return apiSuccess({ ok: true });
  } catch (err) {
    return toApiError(err);
  }
}
