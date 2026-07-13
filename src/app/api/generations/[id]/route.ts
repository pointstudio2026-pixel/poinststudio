import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { generationsContainer } from "@/modules/generations/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** :id here is a projectId -- returns the project's generation history. */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { id: projectId } = await params;
    const result = await generationsContainer.getGenerationUseCase.execute({
      projectId,
      userId: session.sub,
    });
    return apiSuccess(result);
  } catch (err) {
    return toApiError(err);
  }
}
