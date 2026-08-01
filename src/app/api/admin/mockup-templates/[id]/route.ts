import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdmin } from "@/shared/auth/session";
import { mockupsContainer } from "@/modules/mockups/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    requireAdmin(request);
    const { id } = await params;
    const result = await mockupsContainer.deleteMockupTemplateUseCase.execute(id);
    return apiSuccess({ ok: true, mode: result.mode });
  } catch (err) {
    return toApiError(err);
  }
}
