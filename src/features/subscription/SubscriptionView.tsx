"use client";

import { useState } from "react";
import { AppHeader } from "@/features/navigation/AppHeader";
import { PaymentMethodModal } from "@/features/subscription/PaymentMethodModal";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { MessageKey } from "@/shared/i18n/messages/types";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import { getPlanPrice } from "@/modules/subscriptions/domain/planPricing";

const PLAN_LABELS: Record<PlanCode, string> = { free: "Free", pro: "Pro", studio: "Studio" };
const ALLOWANCE_KEYS: Record<PlanCode, MessageKey> = {
  free: "subscription.allowance.free",
  pro: "subscription.allowance.pro",
  studio: "subscription.allowance.studio",
};

interface PlanRow {
  planCode: PlanCode;
  monthlyGenerationLimit: number;
  maxResolution: "standard" | "high";
  priorityQueue: boolean;
}

export function SubscriptionView({
  email,
  name,
  currentPlanCode,
  plans,
}: {
  email: string;
  name: string | null;
  currentPlanCode: PlanCode;
  plans: PlanRow[];
}) {
  const { t, locale } = useTranslation();
  const [paymentModalPlan, setPaymentModalPlan] = useState<PlanCode | null>(null);

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader user={{ email, name }} planCode={currentPlanCode} />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">{t("subscription.title")}</h1>
      <p className="text-sm text-muted">
        {t("subscription.currentPlanLine", { plan: PLAN_LABELS[currentPlanCode] })}
      </p>

      {/* 메인페이지 요금제 섹션(PLANS in HomeView.tsx)과 동일한 카드 디자인 --
          단 여기는 실제 사용자 데이터(현재 플랜/실제 한도)를 보여준다. */}
      <div className="grid items-stretch gap-6 sm:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.planCode === currentPlanCode;
          const highlighted = plan.planCode === "pro";
          return (
            <div
              key={plan.planCode}
              className={`shadow-soft relative flex h-full flex-col gap-5 rounded-2xl border p-7 text-left ${
                highlighted ? "border-ink bg-ink text-paper" : "border-line bg-paper"
              } ${isCurrent ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : ""}`}
            >
              {highlighted && (
                <span className="absolute -top-3 right-6 rounded-full bg-paper px-3 py-1 text-xs font-medium text-ink shadow-soft">
                  {t("home.pricing.popular")}
                </span>
              )}
              <div>
                <p className={`eyebrow text-sm ${highlighted ? "text-paper/70" : "text-muted"}`}>
                  {PLAN_LABELS[plan.planCode]}
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {getPlanPrice(plan.planCode, locale)}
                  <span className="text-base font-normal">{t("common.perMonth")}</span>
                </p>
              </div>
              <ul className="flex flex-1 flex-col gap-2 text-base">
                <li className="flex items-center gap-2">
                  <span aria-hidden>·</span>
                  {t(ALLOWANCE_KEYS[plan.planCode], { limit: plan.monthlyGenerationLimit })}
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden>·</span>
                  {plan.maxResolution === "high" ? t("subscription.highRes") : t("subscription.standardRes")}
                </li>
                <li className="flex items-center gap-2">
                  <span aria-hidden>·</span>
                  {plan.priorityQueue ? t("subscription.priorityQueue") : t("subscription.standardQueue")}
                </li>
              </ul>
              {isCurrent ? (
                <p
                  className={`mt-auto flex h-[52px] items-center justify-center rounded-full border text-base font-medium ${
                    highlighted ? "border-paper/30 text-paper/70" : "border-line text-muted"
                  }`}
                >
                  {t("subscription.currentPlanBadge")}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setPaymentModalPlan(plan.planCode)}
                  className={`mt-auto flex h-[52px] items-center justify-center rounded-full text-base font-medium transition ${
                    highlighted ? "bg-paper text-ink hover:opacity-90" : "border border-line hover:border-ink"
                  }`}
                >
                  {t("subscription.upgradeButton")}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {paymentModalPlan && (
        <PaymentMethodModal planLabel={PLAN_LABELS[paymentModalPlan]} onClose={() => setPaymentModalPlan(null)} />
      )}
      </main>
    </div>
  );
}
