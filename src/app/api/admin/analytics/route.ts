import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdmin } from "@/shared/auth/session";
import { adminContainer } from "@/modules/admin/container";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const analytics = await adminContainer.getAdminAnalyticsUseCase.execute();
    return apiSuccess({ analytics });
  } catch (err) {
    return toApiError(err);
  }
}
