import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { REFRESH_TOKEN_COOKIE, setAuthCookies } from "@/shared/auth/cookies";
import { AuthenticationError } from "@/shared/errors/AppError";
import { authContainer } from "@/modules/auth/container";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const bodyToken =
      body && typeof body === "object" && "refreshToken" in body
        ? String((body as { refreshToken: unknown }).refreshToken)
        : undefined;
    const cookieToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    const refreshToken = bodyToken || cookieToken;

    if (!refreshToken) {
      throw new AuthenticationError("Refresh token이 없습니다.", "AUTH-007");
    }

    const result = await authContainer.refreshTokenUseCase.execute({ refreshToken });

    const res = apiSuccess({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    setAuthCookies(res, result);
    return res;
  } catch (err) {
    return toApiError(err);
  }
}
