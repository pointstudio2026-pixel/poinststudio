import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { mockupsContainer } from "@/modules/mockups/container";

const bodySchema = z.object({
  projectId: z.string().min(1),
  generationVersionId: z.string().min(1),
  sourceImageIndex: z.number().int().min(0).default(0),
  templateId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const mockup = await mockupsContainer.createMockupUseCase.execute({
      projectId: parsed.data.projectId,
      userId: session.sub,
      generationVersionId: parsed.data.generationVersionId,
      sourceImageIndex: parsed.data.sourceImageIndex,
      templateId: parsed.data.templateId,
    });

    return apiSuccess({ mockup }, { status: 202 });
  } catch (err) {
    return toApiError(err);
  }
}
