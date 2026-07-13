import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { ValidationError } from "@/shared/errors/AppError";
import { updateBrandBriefSchema } from "@/modules/brandBriefs/schemas/brandBrief.schemas";
import { brandBriefsContainer } from "@/modules/brandBriefs/container";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { projectId } = await params;
    const result = await brandBriefsContainer.getBrandBriefUseCase.execute({
      projectId,
      userId: session.sub,
    });
    return apiSuccess(result);
  } catch (err) {
    return toApiError(err);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { projectId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updateBrandBriefSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const brief = await brandBriefsContainer.updateBrandBriefUseCase.execute({
      projectId,
      userId: session.sub,
      patch: parsed.data,
    });

    return apiSuccess({ brief });
  } catch (err) {
    return toApiError(err);
  }
}
