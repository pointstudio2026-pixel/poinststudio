import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { saveAnswerSchema } from "@/modules/interviews/schemas/interview.schemas";
import { interviewsContainer } from "@/modules/interviews/container";

const bodySchema = saveAnswerSchema.extend({ projectId: z.string().min(1) });

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const interview = await interviewsContainer.saveAnswerUseCase.execute({
      projectId: parsed.data.projectId,
      userId: session.sub,
      questionKey: parsed.data.questionKey,
      answer: parsed.data.answer,
    });

    return apiSuccess({ interview });
  } catch (err) {
    return toApiError(err);
  }
}
