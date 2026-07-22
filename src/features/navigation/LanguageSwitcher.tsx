"use client";

import { useEffect, useRef, useState } from "react";
import { LOCALES, type Locale } from "@/shared/i18n/locale";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

/**
 * 각 언어는 자기 자신의 문자로 표기한다 -- 지금 어떤 언어를 보고 있든 5개
 * 언어 이름은 항상 원어 그대로 보여야 하므로 t()가 아니라 고정 상수로 둔다.
 */
const LOCALE_LABELS: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  fr: "Français",
  de: "Deutsch",
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-3.5 py-[5px] text-sm font-medium text-ink transition hover:bg-ink hover:text-paper"
        aria-expanded={open}
        aria-label="Language"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="8" cy="8" r="6.5" />
          <ellipse cx="8" cy="8" rx="2.8" ry="6.5" />
          <path d="M1.7 8h12.6M2.6 4.8h10.8M2.6 11.2h10.8" strokeLinecap="round" />
        </svg>
        {LOCALE_LABELS[locale]}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M1.5 3.5L5 7l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-36 rounded-xl border border-line bg-surface p-1.5 shadow-soft">
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setLocale(code);
                setOpen(false);
              }}
              aria-current={locale === code}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-paper ${
                locale === code ? "font-medium" : ""
              }`}
            >
              {LOCALE_LABELS[code]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
