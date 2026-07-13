import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";

export async function GET(request: NextRequest) {
  try {
    const session = requireUser(request);
    const user = await authContainer.getMeUseCase.execute({ userId: session.sub });
    return apiSuccess({ user });
  } catch (err) {
    return toApiError(err);
  }
}
