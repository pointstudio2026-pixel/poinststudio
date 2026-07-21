import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { brandStrategiesContainer } from "@/modules/brandStrategies/container";

const bodySchema = z.object({
  projectId: z.string().min(1),
  candidateIndex: z.number().int().min(0),
});

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const strategy = await brandStrategiesContainer.selectBrandStrategyUseCase.execute({
      projectId: parsed.data.projectId,
      userId: session.sub,
      candidateIndex: parsed.data.candidateIndex,
    });

    return apiSuccess({ strategy }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
