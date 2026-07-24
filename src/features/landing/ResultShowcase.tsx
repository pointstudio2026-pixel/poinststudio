"use client";

import { useState } from "react";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { MessageKey } from "@/shared/i18n/messages/types";

const STYLE_TILES: { nameKey: MessageKey; image: string }[] = [
  { nameKey: "home.showcase.style.minimalEuro", image: "/landing/showcase/style-minimal-euro.png" },
  { nameKey: "home.showcase.style.naturalWarm", image: "/landing/showcase/style-natural-warm.png" },
  { nameKey: "home.showcase.style.cleanLab", image: "/landing/showcase/style-clean-lab.png" },
  { nameKey: "home.showcase.style.softBeauty", image: "/landing/showcase/style-soft-beauty.png" },
];

const LOGO_DIRECTIONS: { nameKey: MessageKey; image: string }[] = [
  { nameKey: "home.showcase.logo.symbol", image: "/landing/showcase/logo-symbol.png" },
  { nameKey: "home.showcase.logo.wordmark", image: "/landing/showcase/logo-wordmark.png" },
  { nameKey: "home.showcase.logo.initial", image: "/landing/showcase/logo-initial.png" },
];

const COLOR_SWATCHES: { hex: string; nameKey: MessageKey }[] = [
  { hex: "#D9CBB8", nameKey: "home.showcase.color.sand" },
  { hex: "#7C6A56", nameKey: "home.showcase.color.bark" },
  { hex: "#3A342B", nameKey: "home.showcase.color.espresso" },
  { hex: "#171512", nameKey: "home.showcase.color.ink" },
];

const MOCKUP_KINDS: { nameKey: MessageKey; image: string }[] = [
  { nameKey: "home.showcase.mockup.package", image: "/landing/showcase/mockup-package.png" },
  { nameKey: "home.showcase.mockup.businessCard", image: "/landing/showcase/mockup-business-card.png" },
  { nameKey: "home.showcase.mockup.webBanner", image: "/landing/showcase/mockup-web-banner.png" },
];

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image} alt={t(s.nameKey)} className="aspect-square w-full object-cover" />
            <p className="px-3 py-2 text-sm font-medium">{t(s.nameKey)}</p>
          </div>
        ))}
      </div>
    ),
    logo: (
      <div className="grid grid-cols-3 gap-3">
        {LOGO_DIRECTIONS.map((l) => (
          <div
            key={l.nameKey}
            className="flex flex-col items-center gap-2 rounded-xl border border-line bg-paper p-5"
          >
            <div className="h-16 w-16 overflow-hidden rounded-full border border-line bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.image} alt={t(l.nameKey)} className="h-full w-full object-cover" />
            </div>
            <p className="text-sm text-muted">{t(l.nameKey)}</p>
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
        {MOCKUP_KINDS.map((m) => (
          <div key={m.nameKey} className="overflow-hidden rounded-xl border border-line bg-paper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.image}
              alt={t(m.nameKey)}
              className="aspect-[4/3] w-full object-cover"
            />
            <p className="px-3 py-2 text-sm font-medium">{t("home.showcase.mockup.applied", { name: t(m.nameKey) })}</p>
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
