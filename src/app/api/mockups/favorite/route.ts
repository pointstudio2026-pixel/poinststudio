import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { mockupsContainer } from "@/modules/mockups/container";

const bodySchema = z.object({ mockupId: z.string().min(1), favorite: z.boolean() });

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const mockup = await mockupsContainer.toggleMockupFavoriteUseCase.execute({
      mockupId: parsed.data.mockupId,
      userId: session.sub,
      favorite: parsed.data.favorite,
    });

    return apiSuccess({ mockup });
  } catch (err) {
    return toApiError(err);
  }
}
