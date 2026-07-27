"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Locale } from "@/shared/i18n/locale";
import { setLocaleCookie } from "@/shared/i18n/cookie";
import { MESSAGES } from "@/shared/i18n/messages";
import type { MessageKey } from "@/shared/i18n/messages/types";
import { guidesHubHref, guidesHubHrefForCategory } from "@/features/landingArticles/routing";

type TranslateFn = (key: MessageKey, params?: Record<string, string | number>) => string;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
  // 가이드 허브/글 화면이 마운트되는 동안 자신의 category("faq" 등)를
  // 등록해두는 용도 -- 언어 전환 시 어느 카테고리 허브로 돌아가야 하는지
  // (일반 디자인 가이드 허브 vs FAQ 허브) URL만으로는 알 수 없어서
  // (글 슬러그에 카테고리가 안 들어있음) 실제 렌더링된 글의 category를
  // 신뢰할 수 있는 값으로 그대로 전달받는다.
  setGuideCategory: (category: string | null) => void;
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

// /guides(가이드 SEO 존)는 쿠키가 아니라 URL 자체가 언어를 결정하는 별도
// 시스템이다(hreflang을 위한 의도적 설계) -- 그래서 이 화면에 있는 동안
// 언어 드롭다운으로 쿠키만 바꾸면 상단 네비게이션은 새 언어로 바뀌는데
// 페이지 본문은 그대로 예전 언어로 남는 불일치가 생긴다. 이 경로에
// 있을 때만 쿠키 갱신 대신 실제로 해당 언어 zone의 허브로 이동시킨다
// (특정 글 슬러그로 그대로 이동시키면 그 언어로 아직 번역 안 된 글일 때
// 404가 날 수 있어, 항상 안전한 허브로 보낸다 -- 글 상세 화면 안에는
// 이미 번역된 언어만 보여주는 자체 전환 버튼이 따로 있다).
function isGuidesPath(pathname: string): boolean {
  return /^(?:\/(en|ja|fr|de))?\/guides(\/.*)?$/.test(pathname);
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [guideCategory, setGuideCategory] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // 가이드 화면을 벗어나면 이전 화면에서 등록해둔 category가 남아있으면
  // 안 되므로 경로가 바뀔 때마다 초기화한다 -- 새 가이드 화면이 마운트되면
  // 자기 category를 다시 등록하므로(아래 setGuideCategory 호출) 실제로는
  // 그 사이의 찰나에만 null이었다가 바로 맞는 값으로 채워진다.
  useEffect(() => {
    if (!isGuidesPath(pathname)) {
      setGuideCategory(null);
    }
  }, [pathname]);

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

      if (isGuidesPath(pathname)) {
        // /guides 존은 쿠키가 아니라 URL로 언어가 결정되므로, 쿠키만
        // 바꾸고 refresh해봤자 본문은 그대로다 -- 실제로 새 언어 zone의
        // 허브로 이동시킨다. FAQ 글을 보고 있었다면 일반 디자인 가이드
        // 허브가 아니라 FAQ 허브로 보내야 한다(등록된 guideCategory 기준).
        router.push(
          guideCategory === "faq" ? guidesHubHrefForCategory(next, "faq") : guidesHubHref(next),
        );
        return;
      }

      // 클라이언트 컴포넌트는 locale state가 바뀌면 즉시 다시 렌더링되지만,
      // getServerLocale()로 쿠키를 직접 읽어 렌더링하는 서버 컴포넌트
      // 페이지(사용방법/개인정보처리방침/이용약관 등)는 실제 네비게이션이
      // 일어나기 전까지 그대로 남는다 -- router.refresh()로 현재 라우트의
      // 서버 컴포넌트를 새 쿠키 기준으로 다시 렌더링하게 강제한다.
      router.refresh();
    },
    [router, pathname, guideCategory],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, setGuideCategory }}>{children}</LocaleContext.Provider>
  );
}

export function useTranslation(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useTranslation must be used within LocaleProvider");
  return ctx;
}
