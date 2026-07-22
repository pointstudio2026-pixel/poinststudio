import { DEFAULT_LOCALE, isLocale, type Locale } from "@/shared/i18n/locale";

export const LOCALE_COOKIE = "aster_locale";
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseLocaleCookie(raw: string | undefined): Locale {
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

/**
 * Client only. Writes directly to document.cookie so switching language
 * never needs a network round trip -- that's what makes the switch instant.
 * Deliberately not httpOnly (unlike shared/auth/cookies.ts's tokens): this
 * cookie must be readable/writable from client JS. Kept in its own module
 * (no next/headers import here) so client components can import it without
 * pulling a server-only API into the browser bundle.
 */
export function setLocaleCookie(locale: Locale): void {
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax${secure}`;
}
