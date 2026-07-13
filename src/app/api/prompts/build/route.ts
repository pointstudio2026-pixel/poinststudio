import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { promptsContainer } from "@/modules/prompts/container";

const bodySchema = z.object({
  projectId: z.string().min(1),
  provider: z.enum(["openai", "gemini", "nanobanana"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const prompt = await promptsContainer.buildPromptUseCase.execute({
      projectId: parsed.data.projectId,
      userId: session.sub,
      provider: parsed.data.provider,
    });

    return apiSuccess({ prompt }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
