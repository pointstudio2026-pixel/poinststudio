import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { generationsContainer } from "@/modules/generations/container";

const bodySchema = z.object({
  projectId: z.string().min(1),
  provider: z.enum(["openai", "gemini"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const version = await generationsContainer.createGenerationUseCase.execute({
      projectId: parsed.data.projectId,
      userId: session.sub,
      provider: parsed.data.provider,
      userRole: session.role,
    });

    return apiSuccess({ generation: version }, { status: 202 });
  } catch (err) {
    return toApiError(err);
  }
}
