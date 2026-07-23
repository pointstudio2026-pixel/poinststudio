import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { generationsContainer } from "@/modules/generations/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const bodySchema = z.object({
  likedTags: z.array(z.string().min(1)).default([]),
  dislikedTags: z.array(z.string().min(1)).default([]),
  freeText: z.string().max(1000).nullable().default(null),
});

/** :id here is a generationVersionId. 평가는 완전히 선택사항이라 이 엔드포인트를 호출하지 않아도 다음 단계로 진행할 수 있다. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id: generationVersionId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const feedback = await generationsContainer.submitGenerationFeedbackUseCase.execute({
      generationVersionId,
      userId: session.sub,
      likedTags: parsed.data.likedTags,
      dislikedTags: parsed.data.dislikedTags,
      freeText: parsed.data.freeText,
    });

    return apiSuccess({ feedback }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
