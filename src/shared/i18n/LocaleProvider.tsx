"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/shared/i18n/locale";
import { setLocaleCookie } from "@/shared/i18n/cookie";
import { MESSAGES } from "@/shared/i18n/messages";
import type { MessageKey } from "@/shared/i18n/messages/types";

type TranslateFn = (key: MessageKey, params?: Record<string, string | number>) => string;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function resolveDotPath(tree: unknown, key: string): string {
  const value = key.split(".").reduce<unknown>((node, segment) => {
    if (node && typeof node === "object" && segment in node) {
      return (node as Record<string, unknown>)[segment];
    }
    return undefined;
  }, tree);
  return typeof value === "string" ? value : key;
}

function interpolate(raw: string, params: Record<string, string | number>): string {
  return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  const t = useCallback<TranslateFn>(
    (key, params) => {
      const raw = resolveDotPath(MESSAGES[locale], key);
      return params ? interpolate(raw, params) : raw;
    },
    [locale],
  );

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      setLocaleCookie(next);
      // 클라이언트 컴포넌트는 locale state가 바뀌면 즉시 다시 렌더링되지만,
      // getServerLocale()로 쿠키를 직접 읽어 렌더링하는 서버 컴포넌트
      // 페이지(가이드/개인정보처리방침/이용약관 등)는 실제 네비게이션이
      // 일어나기 전까지 그대로 남는다 -- router.refresh()로 현재 라우트의
      // 서버 컴포넌트를 새 쿠키 기준으로 다시 렌더링하게 강제한다.
      router.refresh();
    },
    [router],
  );

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useTranslation(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useTranslation must be used within LocaleProvider");
  return ctx;
}
