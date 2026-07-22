import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocaleCookie } from "@/shared/i18n/cookie";
import type { Locale } from "@/shared/i18n/locale";

/** Server components only -- reads the locale cookie via next/headers. */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  return parseLocaleCookie(store.get(LOCALE_COOKIE)?.value);
}
