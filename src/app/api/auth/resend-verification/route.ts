import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireUser } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    await authContainer.resendVerificationEmailUseCase.execute({ userId: session.sub });
    return apiSuccess({ ok: true });
  } catch (err) {
    return toApiError(err);
  }
}
