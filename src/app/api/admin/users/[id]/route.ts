import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdmin, requireAdminTier } from "@/shared/auth/session";
import { adminContainer } from "@/modules/admin/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireAdmin(request);
    const { id } = await params;
    const detail = await adminContainer.getUserDetailUseCase.execute({
      targetUserId: id,
      actingUserId: session.sub,
    });
    return apiSuccess({ detail });
  } catch (err) {
    return toApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireAdminTier(request, ["super_admin"]);
    const { id } = await params;
    await adminContainer.deleteUserUseCase.execute({ targetUserId: id, actingUserId: session.sub });
    return apiSuccess({ deleted: true });
  } catch (err) {
    return toApiError(err);
  }
}
