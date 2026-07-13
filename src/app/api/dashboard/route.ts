import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { dashboardContainer } from "@/modules/dashboard/container";

export async function GET(request: NextRequest) {
  try {
    const session = requireUser(request);
    const search = request.nextUrl.searchParams.get("search") ?? undefined;

    const result = await dashboardContainer.getDashboardUseCase.execute({
      userId: session.sub,
      role: session.role,
      search,
    });

    return apiSuccess(result);
  } catch (err) {
    return toApiError(err);
  }
}
