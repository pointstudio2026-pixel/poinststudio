import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdmin } from "@/shared/auth/session";
import { adminContainer } from "@/modules/admin/container";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = requireAdmin(request);
    const { id } = await params;
    const announcement = await adminContainer.deactivateAnnouncementUseCase.execute({
      adminUserId: session.sub,
      announcementId: id,
    });
    return apiSuccess({ announcement });
  } catch (err) {
    return toApiError(err);
  }
}
