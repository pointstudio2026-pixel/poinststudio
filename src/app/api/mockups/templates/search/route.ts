import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { mockupsContainer } from "@/modules/mockups/container";

export async function GET(request: NextRequest) {
  try {
    requireUser(request);
    const query = new URL(request.url).searchParams.get("q") ?? "";
    const templates = await mockupsContainer.searchMockupTemplatesUseCase.execute({ query });
    return apiSuccess({ templates });
  } catch (err) {
    return toApiError(err);
  }
}
