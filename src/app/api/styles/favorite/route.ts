import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { stylesContainer } from "@/modules/styles/container";

const bodySchema = z.object({ styleId: z.string().min(1), favorite: z.boolean() });

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    await stylesContainer.toggleStyleFavoriteUseCase.execute({
      userId: session.sub,
      styleId: parsed.data.styleId,
      favorite: parsed.data.favorite,
    });

    return apiSuccess({ styleId: parsed.data.styleId, favorite: parsed.data.favorite });
  } catch (err) {
    return toApiError(err);
  }
}
