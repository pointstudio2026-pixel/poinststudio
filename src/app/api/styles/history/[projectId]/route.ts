import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { stylesContainer } from "@/modules/styles/container";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireUser(request);
    const { projectId } = await params;
    const result = await stylesContainer.getStyleSelectionHistoryUseCase.execute({
      projectId,
      userId: session.sub,
    });
    return apiSuccess(result);
  } catch (err) {
    return toApiError(err);
  }
}
