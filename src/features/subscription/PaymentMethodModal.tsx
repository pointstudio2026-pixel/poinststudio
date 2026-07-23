"use client";

import { useState } from "react";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { MessageKey } from "@/shared/i18n/messages/types";

export type PaymentMethod = "toss" | "kakaopay" | "paypal";

function TossIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
      <rect width="20" height="20" rx="6" fill="#1B64DA" />
      <path
        d="M6 10.3l2.6 2.6L14.5 7"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KakaoPayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
      <rect width="20" height="20" rx="6" fill="#FFE812" />
      <circle cx="10" cy="10" r="5" fill="#3C1E1E" />
      <text x="10" y="12.8" fontSize="6.5" fontWeight="700" fill="#FFE812" textAnchor="middle">
        ₩
      </text>
    </svg>
  );
}

function PayPalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
      <rect width="20" height="20" rx="6" fill="#003087" />
      <path
        d="M7 14.5l1.1-7h2.6c1.7 0 2.7.8 2.4 2.3-.3 1.6-1.6 2.4-3.2 2.4H8.6l-.4 2.3H7z"
        fill="#009CDE"
      />
      <path
        d="M5.8 14.5l1.1-7h2.6c1.7 0 2.7.8 2.4 2.3-.3 1.6-1.6 2.4-3.2 2.4H7.4l-.4 2.3H5.8z"
        fill="#fff"
      />
    </svg>
  );
}

const PAYMENT_METHODS: { key: PaymentMethod; labelKey: MessageKey; Icon: () => React.JSX.Element }[] = [
  { key: "toss", labelKey: "subscription.paymentModal.toss", Icon: TossIcon },
  { key: "kakaopay", labelKey: "subscription.paymentModal.kakaopay", Icon: KakaoPayIcon },
  { key: "paypal", labelKey: "subscription.paymentModal.paypal", Icon: PayPalIcon },
];

/** SubscriptionView와 홈페이지 요금제 섹션이 공유하는 결제 수단 선택 모달 -- 실제 결제 연동 전, "정식 출시 이후" 안내만 보여준다. */
export function PaymentMethodModal({ planLabel, onClose }: { planLabel: string; onClose: () => void }) {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-8" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold">{t("subscription.paymentModal.title", { plan: planLabel })}</h2>

        <div className="mt-4 flex flex-col gap-2">
          {PAYMENT_METHODS.map(({ key, labelKey, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedMethod(key)}
              className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition ${
                selectedMethod === key ? "border-ink bg-surface" : "border-line hover:border-ink"
              }`}
            >
              <Icon />
              {t(labelKey)}
            </button>
          ))}
        </div>

        {selectedMethod && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t("subscription.paymentModal.notReady")}
          </p>
        )}

        <button type="button" onClick={onClose} className="mt-4 w-full rounded-lg border border-line px-4 py-2 text-sm">
          {t("subscription.paymentModal.close")}
        </button>
      </div>
    </div>
  );
}
