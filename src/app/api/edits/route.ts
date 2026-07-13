import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { editsContainer } from "@/modules/edits/container";

const bodySchema = z.object({
  projectId: z.string().min(1),
  sourceVersionId: z.string().min(1),
  sourceImageIndex: z.number().int().min(0),
  presetKey: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const edit = await editsContainer.createEditUseCase.execute({
      projectId: parsed.data.projectId,
      userId: session.sub,
      sourceVersionId: parsed.data.sourceVersionId,
      sourceImageIndex: parsed.data.sourceImageIndex,
      presetKey: parsed.data.presetKey,
    });

    return apiSuccess({ edit }, { status: 202 });
  } catch (err) {
    return toApiError(err);
  }
}
