"use client";

import { useState } from "react";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { MessageKey } from "@/shared/i18n/messages/types";

const STYLE_TILES: { nameKey: MessageKey; bg: string }[] = [
  { nameKey: "home.showcase.style.minimalEuro", bg: "linear-gradient(135deg, #F1EBDF, #D9CBB8)" },
  { nameKey: "home.showcase.style.naturalWarm", bg: "linear-gradient(135deg, #EFE7D8, #B9AE9A)" },
  { nameKey: "home.showcase.style.cleanLab", bg: "linear-gradient(135deg, #EAF0F6, #C9D6E3)" },
  { nameKey: "home.showcase.style.softBeauty", bg: "linear-gradient(135deg, #F1EBDF, #CBB98F)" },
];

const LOGO_DIRECTIONS: MessageKey[] = ["home.showcase.logo.symbol", "home.showcase.logo.wordmark", "home.showcase.logo.initial"];

const COLOR_SWATCHES: { hex: string; nameKey: MessageKey }[] = [
  { hex: "#D9CBB8", nameKey: "home.showcase.color.sand" },
  { hex: "#7C6A56", nameKey: "home.showcase.color.bark" },
  { hex: "#3A342B", nameKey: "home.showcase.color.espresso" },
  { hex: "#171512", nameKey: "home.showcase.color.ink" },
];

const MOCKUP_KINDS: MessageKey[] = ["home.showcase.mockup.package", "home.showcase.mockup.businessCard", "home.showcase.mockup.webBanner"];

const TAB_KEYS: { key: string; labelKey: MessageKey }[] = [
  { key: "strategy", labelKey: "home.showcase.tabStrategy" },
  { key: "style", labelKey: "home.showcase.tabStyle" },
  { key: "logo", labelKey: "home.showcase.tabLogo" },
  { key: "color", labelKey: "home.showcase.tabColor" },
  { key: "mockup", labelKey: "home.showcase.tabMockup" },
];

export function ResultShowcase() {
  const [active, setActive] = useState(0);
  const { t } = useTranslation();

  const panels: Record<string, React.ReactNode> = {
    strategy: (
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-muted">{t("home.showcase.strategy.positioningLabel")}</p>
        <p className="text-base leading-relaxed sm:text-lg">{t("home.showcase.strategy.positioningText")}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            t("home.showcase.strategy.kw1"),
            t("home.showcase.strategy.kw2"),
            t("home.showcase.strategy.kw3"),
            t("home.showcase.strategy.kw4"),
          ].map((kw) => (
            <span key={kw} className="rounded-full border border-line bg-paper px-3 py-1 text-sm">
              {kw}
            </span>
          ))}
        </div>
      </div>
    ),
    style: (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STYLE_TILES.map((s) => (
          <div key={s.nameKey} className="overflow-hidden rounded-xl border border-line bg-paper">
            <div className="aspect-square" style={{ background: s.bg }} />
            <p className="px-3 py-2 text-sm font-medium">{t(s.nameKey)}</p>
          </div>
        ))}
      </div>
    ),
    logo: (
      <div className="grid grid-cols-3 gap-3">
        {LOGO_DIRECTIONS.map((nameKey, i) => (
          <div
            key={nameKey}
            className="flex flex-col items-center gap-2 rounded-xl border border-line bg-paper p-5"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-surface">
              {i === 0 && (
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <circle cx="14" cy="14" r="9" />
                </svg>
              )}
              {i === 1 && <span className="font-serif text-sm">Aster</span>}
              {i === 2 && <span className="text-lg font-semibold">A.</span>}
            </div>
            <p className="text-sm text-muted">{t(nameKey)}</p>
          </div>
        ))}
      </div>
    ),
    color: (
      <div className="flex flex-wrap gap-4">
        {COLOR_SWATCHES.map((c) => (
          <div key={c.hex} className="flex flex-col items-center gap-2">
            <span className="h-16 w-16 rounded-2xl border border-line" style={{ backgroundColor: c.hex }} />
            <p className="text-sm">{t(c.nameKey)}</p>
            <p className="text-xs text-muted">{c.hex}</p>
          </div>
        ))}
      </div>
    ),
    mockup: (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MOCKUP_KINDS.map((nameKey) => (
          <div key={nameKey} className="overflow-hidden rounded-xl border border-line bg-paper">
            <div className="flex aspect-[4/3] items-center justify-center bg-tint-beige">
              <span className="font-serif text-2xl text-ink/70">Aster</span>
            </div>
            <p className="px-3 py-2 text-sm font-medium">{t("home.showcase.mockup.applied", { name: t(nameKey) })}</p>
          </div>
        ))}
      </div>
    ),
  };

  return (
    <div className="shadow-soft rounded-3xl border border-line bg-surface p-5 sm:p-8">
      <div className="flex flex-wrap gap-2">
        {TAB_KEYS.map((tab, i) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(i)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active === i ? "bg-ink text-paper" : "border border-line text-muted hover:border-ink hover:text-ink"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>
      <div className="mt-6 min-h-[220px]">{panels[TAB_KEYS[active]!.key]}</div>
    </div>
  );
}
