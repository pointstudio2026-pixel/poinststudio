import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdminTier } from "@/shared/auth/session";
import { trainingExamplesContainer } from "@/modules/trainingExamples/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireAdminTier(request, ["super_admin", "manager"]);
    const { id } = await params;
    await trainingExamplesContainer.deleteTrainingExampleUseCase.execute({ id, deletedByUserId: session.sub });
    return apiSuccess({ deleted: true });
  } catch (err) {
    return toApiError(err);
  }
}
