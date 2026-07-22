"use client";

import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { MessageKey } from "@/shared/i18n/messages/types";

const STEP_KEYS: MessageKey[] = [
  "home.mockup.steps.brandInterview",
  "home.mockup.steps.style",
  "home.mockup.steps.brandStrategy",
  "home.mockup.steps.generation",
  "home.mockup.steps.conceptBoard",
  "home.mockup.steps.mockup",
];
const ACTIVE_STEP_INDEX = 2;

const PALETTE = ["#D9CBB8", "#7C6A56", "#3A342B", "#171512"];

const GENERATIONS = [
  { bg: "linear-gradient(135deg, #EFE7D8, #D9CBB8)" },
  { bg: "linear-gradient(135deg, #E7E2D6, #B9AE9A)" },
  { bg: "linear-gradient(135deg, #EAF0F6, #C9D6E3)" },
  { bg: "linear-gradient(135deg, #F1EBDF, #CBB98F)" },
];

/**
 * Purely illustrative recreation of the real project workspace (same step
 * labels/order as WORKSPACE_STEPS) -- not a live embed, just a static
 * mockup for the marketing Hero.
 */
export function ProductMockup() {
  const { t } = useTranslation();

  return (
    <div className="shadow-soft-lg w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="flex items-center gap-1.5 border-b border-line px-5 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="ml-3 text-xs text-muted">{t("home.mockup.workspaceTitle")}</span>
      </div>

      <div className="flex">
        <aside className="hidden w-32 flex-shrink-0 flex-col gap-1 border-r border-line p-3 sm:flex">
          {STEP_KEYS.map((stepKey, i) => (
            <span
              key={stepKey}
              className={`rounded-full px-2.5 py-1.5 text-[11px] leading-tight ${
                i === ACTIVE_STEP_INDEX ? "bg-ink text-paper" : i < ACTIVE_STEP_INDEX ? "text-ink" : "text-muted"
              }`}
            >
              {t(stepKey)}
            </span>
          ))}
        </aside>

        <div className="flex-1 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted">{t("home.mockup.analysisResult")}</p>
            <span className="rounded-full bg-tint-blue px-2 py-0.5 text-[10px] font-medium text-ink">
              {t("home.mockup.highConfidence")}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed">{t("home.mockup.positioning")}</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-paper p-3">
              <p className="text-[10px] font-medium text-muted">{t("home.mockup.fontPairing")}</p>
              <p className="mt-1 font-serif text-lg">Canela</p>
            </div>
            <div className="rounded-xl border border-line bg-paper p-3">
              <p className="text-[10px] font-medium text-muted">{t("home.mockup.colorPalette")}</p>
              <div className="mt-1.5 flex gap-1.5">
                {PALETTE.map((color) => (
                  <span key={color} className="h-4 w-4 rounded-full border border-line" style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          </div>

          <p className="mt-4 text-[10px] font-medium text-muted">{t("home.mockup.generationResult")}</p>
          <div className="mt-1.5 grid grid-cols-4 gap-2">
            {GENERATIONS.map((g, i) => (
              <div key={i} className="aspect-square rounded-lg border border-line" style={{ background: g.bg }} />
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-line">
              <div
                className="h-1.5 rounded-full bg-ink"
                style={{ width: `${((ACTIVE_STEP_INDEX + 1) / STEP_KEYS.length) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted">
              {t("home.mockup.progress", { current: ACTIVE_STEP_INDEX + 1, total: STEP_KEYS.length })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
