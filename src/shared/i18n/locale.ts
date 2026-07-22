export const LOCALES = ["ko", "en", "ja", "fr", "de"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ko";

export function isLocale(value: string | undefined | null): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Intl API locale tag for each UI locale, for date/number formatting. */
export const INTL_LOCALE: Record<Locale, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
  fr: "fr-FR",
  de: "de-DE",
};

/**
 * Picks the best-supported locale from a browser's Accept-Language header
 * (e.g. "en-US,en;q=0.9,ko;q=0.8") -- used only as a first-visit default
 * before any explicit choice exists (see getServerLocale()). Entries are
 * ranked by their q-value (defaulting to 1 when absent), and each tag is
 * matched on its primary subtag only ("fr-CA" -> "fr"). Returns null if
 * nothing in the header matches a supported locale, or the header is
 * missing/empty.
 */
export function detectLocaleFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return { tag: (tag ?? "").trim().toLowerCase(), q: Number.isNaN(q) ? 1 : q };
    })
    .filter((entry) => entry.tag.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const primary = tag.split("-")[0];
    if (isLocale(primary)) return primary;
  }
  return null;
}
