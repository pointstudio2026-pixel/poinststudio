"use client";

import { useState } from "react";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { MessageKey } from "@/shared/i18n/messages/types";

export type PaymentMethod = "card" | "kakaopay" | "paypal";

/**
 * 실제 연동 예정: card -> 포트원(카드 정기결제), kakaopay -> 카카오페이
 * 자체 API(정기결제 전용 CID), paypal -> PayPal Subscriptions API. 지금은
 * 사업자 등록/API 키가 없어 셋 다 버튼을 눌러도 notReady 안내만 뜬다.
 * 나중에 실제 연동할 때는 이 파일의 각 버튼 onClick을 해당 SDK/결제창
 * 호출로 교체하면 된다 -- 버튼 구성·라벨·아이콘은 그대로 재사용 가능.
 *
 * 카카오페이/PayPal은 아이콘 심볼 대신 실제 브랜드 컬러의 워드마크
 * 배지로 표시한다 -- 이전에는 로고 형태를 직접 손으로 근사해서 그렸는데
 * 실물과 다르게 보인다는 피드백을 받았다. 아이콘 도형을 다시 추정하는
 * 대신, 훨씬 알아보기 쉽고 정확한 "실제 브랜드명 + 실제 브랜드 컬러"
 * 조합으로 바꿨다("~로 결제/로그인" 버튼에 상표를 노출하는 것은 업계
 * 표준 관행이라 문제 없음). 카드결제는 특정 브랜드가 아니라 범용
 * 카드 아이콘을 쓴다.
 */
function CardIcon() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="19" height="13" rx="2" stroke="currentColor" />
      <rect x="0.5" y="3.5" width="19" height="2.5" fill="currentColor" />
    </svg>
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
  { key: "card", labelKey: "subscription.paymentModal.card", Icon: CardIcon },
  { key: "kakaopay", labelKey: "subscription.paymentModal.kakaopay", Icon: KakaoPayIcon },
  { key: "paypal", labelKey: "subscription.paymentModal.paypal", Icon: PayPalIcon },
];

/** 카카오페이는 국내 전용, PayPal은 해외 결제까지 커버 -- 한국어 로케일에서만 카드/카카오페이를 같이 보여주고, 나머지 로케일은 PayPal만 보여준다. */
const KOREAN_LOCALE_METHODS: PaymentMethod[] = ["card", "kakaopay", "paypal"];
const OTHER_LOCALE_METHODS: PaymentMethod[] = ["paypal"];

/** SubscriptionView와 홈페이지 요금제 섹션이 공유하는 결제 수단 선택 모달 -- 실제 결제 연동 전, "정식 출시 이후" 안내만 보여준다. */
export function PaymentMethodModal({ planLabel, onClose }: { planLabel: string; onClose: () => void }) {
  const { t, locale } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const visibleKeys = locale === "ko" ? KOREAN_LOCALE_METHODS : OTHER_LOCALE_METHODS;
  const visibleMethods = PAYMENT_METHODS.filter((m) => visibleKeys.includes(m.key));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-8" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-paper p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold">{t("subscription.paymentModal.title", { plan: planLabel })}</h2>

        <div className="mt-4 flex flex-col gap-2">
          {visibleMethods.map(({ key, labelKey, Icon }) => (
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
