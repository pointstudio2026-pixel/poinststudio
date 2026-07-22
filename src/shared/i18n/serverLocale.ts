import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE } from "@/shared/i18n/cookie";
import { DEFAULT_LOCALE, detectLocaleFromAcceptLanguage, isLocale, type Locale } from "@/shared/i18n/locale";

/**
 * Server components only -- reads the locale cookie via next/headers. Once
 * the user has explicitly picked a language (via LanguageSwitcher), that
 * cookie always wins. Only a first-time visitor with no cookie yet falls
 * back to their browser's Accept-Language header, then to DEFAULT_LOCALE.
 */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const cookieValue = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieValue)) return cookieValue;

  const headerStore = await headers();
  return detectLocaleFromAcceptLanguage(headerStore.get("accept-language")) ?? DEFAULT_LOCALE;
}
