import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdmin } from "@/shared/auth/session";
import { adminContainer } from "@/modules/admin/container";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const query = new URL(request.url).searchParams.get("query") ?? undefined;
    const users = await adminContainer.searchAdminUsersUseCase.execute({ query });
    return apiSuccess({ users });
  } catch (err) {
    return toApiError(err);
  }
}
