import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { OAUTH_PENDING_SIGNUP_COOKIE, clearOAuthPendingSignupCookie, setAuthCookies } from "@/shared/auth/cookies";
import { verifyOAuthPendingSignupToken } from "@/shared/auth/jwt";
import { buildOauthConsentSchema } from "@/modules/auth/schemas/auth.schemas";
import { authContainer } from "@/modules/auth/container";
import { AuthenticationError, ValidationError } from "@/shared/errors/AppError";
import { LOCALE_COOKIE, parseLocaleCookie } from "@/shared/i18n/cookie";
import { MESSAGES } from "@/shared/i18n/messages";

export async function POST(request: NextRequest) {
  try {
    const locale = parseLocaleCookie(request.cookies.get(LOCALE_COOKIE)?.value);
    const body = await request.json().catch(() => null);
    const parsed = buildOauthConsentSchema(locale).safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(MESSAGES[locale].oauthConsent.invalidInput, parsed.error.flatten());
    }

    const pendingToken = request.cookies.get(OAUTH_PENDING_SIGNUP_COOKIE)?.value;
    if (!pendingToken) {
      throw new AuthenticationError(MESSAGES[locale].oauthConsent.sessionExpired, "AUTH-012");
    }
    const pending = verifyOAuthPendingSignupToken(pendingToken, locale);

    const result = await authContainer.completeOAuthSignupUseCase.execute({
      provider: pending.provider,
      profile: {
        providerAccountId: pending.providerAccountId,
        email: pending.email,
        name: pending.name,
        emailVerified: pending.emailVerified,
      },
      name: parsed.data.name,
      birthDate: new Date(parsed.data.birthDate),
    });

    const res = apiSuccess({ user: result.user }, { status: 201 });
    setAuthCookies(res, result);
    clearOAuthPendingSignupCookie(res);
    return res;
  } catch (err) {
    return toApiError(err);
  }
}
