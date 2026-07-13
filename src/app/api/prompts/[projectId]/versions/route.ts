import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { promptsContainer } from "@/modules/prompts/container";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { projectId } = await params;
    const versions = await promptsContainer.getPromptVersionsUseCase.execute({
      projectId,
      userId: session.sub,
    });
    return apiSuccess({ versions });
  } catch (err) {
    return toApiError(err);
  }
}
