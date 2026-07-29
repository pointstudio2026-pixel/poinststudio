"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/features/navigation/AppHeader";
import { PaymentMethodModal } from "@/features/subscription/PaymentMethodModal";
import { CancelSubscriptionButton } from "@/features/subscription/CancelSubscriptionButton";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { MessageKey } from "@/shared/i18n/messages/types";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import { getPlanPrice } from "@/modules/subscriptions/domain/planPricing";
import { redeemGiftCode } from "@/services/subscription-service";
import { Spinner } from "@/components/Spinner";

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
  currentPeriodEnd,
  plans,
}: {
  email: string;
  name: string | null;
  currentPlanCode: PlanCode;
  currentPeriodEnd: string | null;
  plans: PlanRow[];
}) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [paymentModalPlan, setPaymentModalPlan] = useState<PlanCode | null>(null);
  const [giftCode, setGiftCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [giftCodeError, setGiftCodeError] = useState<string | null>(null);
  const [giftCodeSuccess, setGiftCodeSuccess] = useState<string | null>(null);

  async function handleRedeemGiftCode(e: React.FormEvent) {
    e.preventDefault();
    if (!giftCode.trim()) return;
    setIsRedeeming(true);
    setGiftCodeError(null);
    setGiftCodeSuccess(null);
    try {
      const { subscription } = await redeemGiftCode(giftCode.trim());
      const dateLabel = subscription.currentPeriodEnd
        ? new Date(subscription.currentPeriodEnd).toLocaleDateString(locale)
        : "";
      setGiftCodeSuccess(
        t("subscription.giftCode.success", { plan: PLAN_LABELS[subscription.planCode], date: dateLabel }),
      );
      setGiftCode("");
      router.refresh();
    } catch (err) {
      setGiftCodeError(err instanceof Error ? err.message : t("subscription.giftCode.genericError"));
    } finally {
      setIsRedeeming(false);
    }
  }

  const periodEndLabel = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString(locale) : null;

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader user={{ email, name }} planCode={currentPlanCode} />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 p-5 sm:p-8">
      <h1 className="text-xl font-semibold">{t("subscription.title")}</h1>
      <p className="text-sm text-muted">
        {periodEndLabel
          ? t("subscription.currentPlanLineWithExpiry", { plan: PLAN_LABELS[currentPlanCode], date: periodEndLabel })
          : t("subscription.currentPlanLine", { plan: PLAN_LABELS[currentPlanCode] })}
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

      {currentPlanCode !== "free" && <CancelSubscriptionButton />}

      {currentPlanCode === "free" && (
        <div className="shadow-soft flex flex-col gap-3 rounded-2xl border border-line bg-surface p-6">
          <div>
            <h2 className="text-base font-semibold">{t("subscription.giftCode.title")}</h2>
            <p className="mt-1 text-sm text-muted">{t("subscription.giftCode.description")}</p>
          </div>
          <form onSubmit={handleRedeemGiftCode} className="flex gap-2">
            <input
              type="text"
              value={giftCode}
              onChange={(e) => setGiftCode(e.target.value)}
              placeholder={t("subscription.giftCode.placeholder")}
              className="flex-1 rounded-full border border-line px-4 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={isRedeeming || !giftCode.trim()}
              className="flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-50"
            >
              {isRedeeming && <Spinner />}
              {isRedeeming ? t("subscription.giftCode.submitting") : t("subscription.giftCode.submit")}
            </button>
          </form>
          {giftCodeError && <p className="text-sm text-red-600">{giftCodeError}</p>}
          {giftCodeSuccess && <p className="text-sm text-green-700">{giftCodeSuccess}</p>}
        </div>
      )}
      </main>
    </div>
  );
}
