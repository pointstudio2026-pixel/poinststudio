import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { brandStrategiesContainer } from "@/modules/brandStrategies/container";

const bodySchema = z.object({
  projectId: z.string().min(1),
  provider: z.enum(["openai", "gemini", "claude"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const strategy = await brandStrategiesContainer.executeAsterBrainUseCase.execute({
      projectId: parsed.data.projectId,
      userId: session.sub,
      mode: "execute",
      provider: parsed.data.provider,
    });

    return apiSuccess({ strategy }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
