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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("subscription.title")}</h1>
        <div className="flex items-center gap-3">
          <Link href="/projects" className="text-sm underline">
            {t("subscription.backToProjects")}
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
      <p className="text-sm text-neutral-500">
        {t("subscription.currentPlanLine", { plan: PLAN_LABELS[currentPlanCode] })}
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.planCode === currentPlanCode;
          return (
            <div
              key={plan.planCode}
              className={`rounded-lg border p-4 ${isCurrent ? "border-neutral-900" : "border-neutral-200"}`}
            >
              <h2 className="font-medium">{PLAN_LABELS[plan.planCode]}</h2>
              <p className="mt-1 text-lg font-semibold">
                {PLAN_PRICES[plan.planCode]}
                {t("common.perMonth")}
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                {t(ALLOWANCE_KEYS[plan.planCode], { limit: plan.monthlyGenerationLimit })}
              </p>
              <p className="text-sm text-neutral-500">
                {plan.maxResolution === "high" ? t("subscription.highRes") : t("subscription.standardRes")}
              </p>
              <p className="text-sm text-neutral-500">
                {plan.priorityQueue ? t("subscription.priorityQueue") : t("subscription.standardQueue")}
              </p>
              {isCurrent ? (
                <p className="mt-4 text-center text-sm text-neutral-400">{t("subscription.currentPlanBadge")}</p>
              ) : (
                <button
                  type="button"
                  onClick={() => setPaymentModalPlan(plan.planCode)}
                  className="mt-4 w-full rounded-md bg-neutral-900 px-4 py-2 text-center text-sm text-white transition hover:opacity-90"
                >
                  {t("subscription.upgradeButton")}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {paymentModalPlan && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-8" onClick={closeModal}>
          <div
            className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6"
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
                  className={`rounded-md border px-4 py-2.5 text-left text-sm transition ${
                    selectedMethod === method.key
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-900"
                  }`}
                >
                  {t(method.labelKey)}
                </button>
              ))}
            </div>

            {selectedMethod && (
              <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {t("subscription.paymentModal.notReady")}
              </p>
            )}

            <button
              type="button"
              onClick={closeModal}
              className="mt-4 w-full rounded-md border border-neutral-300 px-4 py-2 text-sm"
            >
              {t("subscription.paymentModal.close")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
