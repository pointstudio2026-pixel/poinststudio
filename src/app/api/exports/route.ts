import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { exportsContainer } from "@/modules/exports/container";
import { CONCEPT_BOARD_SECTIONS } from "@/modules/conceptBoards/domain/ConceptBoard";

const bodySchema = z.object({
  projectId: z.string().min(1),
  source: z.enum(["concept_board", "mockup", "generation"]),
  format: z.enum(["pdf", "png", "jpg"]),
  sourceRefId: z.string().min(1).optional(),
  sections: z.array(z.enum(CONCEPT_BOARD_SECTIONS)).optional(),
  includeBrandInfo: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const job = await exportsContainer.createExportUseCase.execute({
      projectId: parsed.data.projectId,
      userId: session.sub,
      source: parsed.data.source,
      format: parsed.data.format,
      sourceRefId: parsed.data.sourceRefId,
      sections: parsed.data.sections,
      includeBrandInfo: parsed.data.includeBrandInfo,
    });

    return apiSuccess({ export: job }, { status: 202 });
  } catch (err) {
    return toApiError(err);
  }
}
