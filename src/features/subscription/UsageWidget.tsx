"use client";

import { useTranslation } from "@/shared/i18n/LocaleProvider";

const PLAN_LABELS: Record<string, string> = { free: "Free", pro: "Pro", studio: "Studio" };

export interface UsageWidgetProps {
  planCode: string;
  used: number;
  limit: number;
  remaining: number;
}

export function UsageWidget({ planCode, used, limit, remaining }: UsageWidgetProps) {
  const isNearLimit = limit > 0 && remaining / limit <= 0.2;
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-sm rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
      <p className="font-medium">{t("dashboard.usage.summary", { plan: PLAN_LABELS[planCode] ?? planCode })}</p>
      <p className={isNearLimit ? "text-amber-600" : "text-muted"}>
        {t("dashboard.usage.detail", { used, limit, remaining })}
        {isNearLimit && ` ${t("dashboard.usage.nearLimit")}`}
      </p>
    </div>
  );
}
