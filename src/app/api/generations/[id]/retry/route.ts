import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { generationsContainer } from "@/modules/generations/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** :id here is a generationVersionId -- the specific failed request being retried. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id: generationVersionId } = await params;
    const version = await generationsContainer.retryGenerationUseCase.execute({
      generationVersionId,
      userId: session.sub,
      userRole: session.role,
    });
    return apiSuccess({ generation: version }, { status: 202 });
  } catch (err) {
    return toApiError(err);
  }
}
