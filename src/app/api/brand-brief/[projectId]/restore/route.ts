import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { restoreBrandBriefVersionSchema } from "@/modules/brandBriefs/schemas/brandBrief.schemas";
import { brandBriefsContainer } from "@/modules/brandBriefs/container";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const session = requireUser(request);
    const { projectId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = restoreBrandBriefVersionSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const brief = await brandBriefsContainer.restoreBrandBriefVersionUseCase.execute({
      projectId,
      userId: session.sub,
      versionNumber: parsed.data.versionNumber,
    });

    return apiSuccess({ brief });
  } catch (err) {
    return toApiError(err);
  }
}
