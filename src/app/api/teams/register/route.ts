import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { teamsContainer } from "@/modules/teams/container";

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const team = await teamsContainer.registerTeamUseCase.execute({ userId: session.sub });
    return apiSuccess({ team }, { status: 201 });
  } catch (err) {
    return toApiError(err);
  }
}
