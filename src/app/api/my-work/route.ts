import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { mockupsContainer } from "@/modules/mockups/container";

export async function GET(request: NextRequest) {
  try {
    const session = requireUser(request);
    const items = await mockupsContainer.listMyWorkUseCase.execute(session.sub);
    return apiSuccess({ items });
  } catch (err) {
    return toApiError(err);
  }
}
