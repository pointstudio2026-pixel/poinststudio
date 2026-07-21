import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { OAUTH_PENDING_SIGNUP_COOKIE, clearOAuthPendingSignupCookie, setAuthCookies } from "@/shared/auth/cookies";
import { verifyOAuthPendingSignupToken } from "@/shared/auth/jwt";
import { oauthConsentSchema } from "@/modules/auth/schemas/auth.schemas";
import { authContainer } from "@/modules/auth/container";
import { AuthenticationError, ValidationError } from "@/shared/errors/AppError";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = oauthConsentSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const pendingToken = request.cookies.get(OAUTH_PENDING_SIGNUP_COOKIE)?.value;
    if (!pendingToken) {
      throw new AuthenticationError("가입 절차가 만료되었습니다. 다시 로그인해주세요.", "AUTH-012");
    }
    const pending = verifyOAuthPendingSignupToken(pendingToken);

    const result = await authContainer.completeOAuthSignupUseCase.execute({
      provider: pending.provider,
      profile: {
        providerAccountId: pending.providerAccountId,
        email: pending.email,
        name: pending.name,
        emailVerified: pending.emailVerified,
      },
    });

    const res = apiSuccess({ user: result.user }, { status: 201 });
    setAuthCookies(res, result);
    clearOAuthPendingSignupCookie(res);
    return res;
  } catch (err) {
    return toApiError(err);
  }
}
