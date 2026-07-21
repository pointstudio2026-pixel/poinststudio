import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdminTier } from "@/shared/auth/session";
import { adminContainer } from "@/modules/admin/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireAdminTier(request, ["super_admin", "manager"]);
    const { id } = await params;
    await adminContainer.unsuspendUserUseCase.execute({ targetUserId: id, actingUserId: session.sub });
    return apiSuccess({ ok: true });
  } catch (err) {
    return toApiError(err);
  }
}
