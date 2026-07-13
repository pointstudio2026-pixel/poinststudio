import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdmin } from "@/shared/auth/session";
import { adminContainer } from "@/modules/admin/container";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const params = new URL(request.url).searchParams;
    const from = params.get("from");
    const to = params.get("to");

    const logs = await adminContainer.getAuditLogsUseCase.execute({
      userId: params.get("userId") ?? undefined,
      eventType: params.get("eventType") ?? undefined,
      projectId: params.get("projectId") ?? undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: params.get("limit") ? Number(params.get("limit")) : undefined,
    });

    return apiSuccess({ logs });
  } catch (err) {
    return toApiError(err);
  }
}
