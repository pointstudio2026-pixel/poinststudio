import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { generationsContainer } from "@/modules/generations/container";

interface RouteParams {
  params: Promise<{ generationId: string }>;
}

/** :generationId is a generationVersionId -- polled by the Generation Progress UI. */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { generationId } = await params;
    const version = await generationsContainer.getGenerationStatusUseCase.execute({
      generationVersionId: generationId,
      userId: session.sub,
    });
    return apiSuccess({ generation: version });
  } catch (err) {
    return toApiError(err);
  }
}
