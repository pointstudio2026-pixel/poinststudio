"use client";

import { useState } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/features/navigation/LanguageSwitcher";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { MessageKey } from "@/shared/i18n/messages/types";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

const PLAN_LABELS: Record<PlanCode, string> = { free: "Free", pro: "Pro", studio: "Studio" };
const PLAN_PRICES: Record<PlanCode, string> = { free: "₩0", pro: "₩29,000", studio: "₩99,000" };
const ALLOWANCE_KEYS: Record<PlanCode, MessageKey> = {
  free: "subscription.allowance.free",
  pro: "subscription.allowance.pro",
  studio: "subscription.allowance.studio",
};

type PaymentMethod = "toss" | "kakaopay" | "paypal";
const PAYMENT_METHODS: { key: PaymentMethod; labelKey: MessageKey }[] = [
  { key: "toss", labelKey: "subscription.paymentModal.toss" },
  { key: "kakaopay", labelKey: "subscription.paymentModal.kakaopay" },
  { key: "paypal", labelKey: "subscription.paymentModal.paypal" },
];

interface PlanRow {
  planCode: PlanCode;
  monthlyGenerationLimit: number;
  maxResolution: "standard" | "high";
  priorityQueue: boolean;
}

export function SubscriptionView({
  currentPlanCode,
  plans,
}: {
  currentPlanCode: PlanCode;
  plans: PlanRow[];
}) {
  const { t } = useTranslation();
  const [paymentModalPlan, setPaymentModalPlan] = useState<PlanCode | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  function closeModal() {
    setPaymentModalPlan(null);
    setSelectedMethod(null);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 bg-paper p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("subscription.title")}</h1>
        <div className="flex items-center gap-3">
          <Link href="/projects" className="text-sm underline">
            {t("subscription.backToProjects")}
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
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
                  {PLAN_PRICES[plan.planCode]}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-8" onClick={closeModal}>
          <div
            className="w-full max-w-sm rounded-2xl border border-line bg-paper p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold">
              {t("subscription.paymentModal.title", { plan: PLAN_LABELS[paymentModalPlan] })}
            </h2>

            <div className="mt-4 flex flex-col gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.key}
                  type="button"
                  onClick={() => setSelectedMethod(method.key)}
                  className={`rounded-lg border px-4 py-2.5 text-left text-sm transition ${
                    selectedMethod === method.key ? "border-ink bg-surface" : "border-line hover:border-ink"
                  }`}
                >
                  {t(method.labelKey)}
                </button>
              ))}
            </div>

            {selectedMethod && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {t("subscription.paymentModal.notReady")}
              </p>
            )}

            <button
              type="button"
              onClick={closeModal}
              className="mt-4 w-full rounded-lg border border-line px-4 py-2 text-sm"
            >
              {t("subscription.paymentModal.close")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
