"use client";

import { useState } from "react";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { MessageKey } from "@/shared/i18n/messages/types";

export type PaymentMethod = "toss" | "kakaopay" | "paypal";

/**
 * Toss/KakaoPay/PayPal 모두 아이콘 심볼 대신 실제 브랜드 컬러의 워드마크
 * 배지로 표시한다 -- 이전에는 로고 형태를 직접 손으로 근사해서 그렸는데
 * 실물과 다르게 보인다는 피드백을 받았다. 아이콘 도형을 다시 추정하는
 * 대신, 훨씬 알아보기 쉽고 정확한 "실제 브랜드명 + 실제 브랜드 컬러"
 * 조합으로 바꿨다("~로 결제/로그인" 버튼에 상표를 노출하는 것은 업계
 * 표준 관행이라 문제 없음).
 */
function TossIcon() {
  return (
    <span
      className="flex h-5 min-w-5 items-center justify-center rounded px-1 text-[11px] font-bold lowercase tracking-tight text-white"
      style={{ backgroundColor: "#0064FF" }}
      aria-hidden
    >
      toss
    </span>
  );
}

function KakaoPayIcon() {
  return (
    <span
      className="flex h-5 min-w-5 items-center justify-center rounded px-1 text-[11px] font-bold lowercase tracking-tight text-[#3C1E1E]"
      style={{ backgroundColor: "#FFE812" }}
      aria-hidden
    >
      pay
    </span>
  );
}

function PayPalIcon() {
  return (
    <span className="flex h-5 min-w-5 items-center justify-center text-[11px] font-bold italic" aria-hidden>
      <span style={{ color: "#003087" }}>Pay</span>
      <span style={{ color: "#009CDE" }}>Pal</span>
    </span>
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
