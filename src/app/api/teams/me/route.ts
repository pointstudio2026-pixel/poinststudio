import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { teamsContainer } from "@/modules/teams/container";

export async function GET(request: NextRequest) {
  try {
    const session = requireUser(request);
    const result = await teamsContainer.getMyTeamsUseCase.execute({ userId: session.sub });
    return apiSuccess(result);
  } catch (err) {
    return toApiError(err);
  }
}
