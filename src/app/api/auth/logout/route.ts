import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { REFRESH_TOKEN_COOKIE, clearAuthCookies } from "@/shared/auth/cookies";
import { requireUser } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";

export async function POST(request: NextRequest) {
  try {
    const session = requireUser(request);
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    await authContainer.logoutUseCase.execute({ userId: session.sub, refreshToken });

    const res = apiSuccess({ loggedOut: true });
    clearAuthCookies(res);
    return res;
  } catch (err) {
    return toApiError(err);
  }
}
