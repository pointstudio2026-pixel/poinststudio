"use client";

import { useState } from "react";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

/**
 * 실제 결제 연동(PaymentMethodModal과 동일한 사유 -- 사업자 등록/PG 전)
 * 전까지는 눌러도 안내만 보여준다. 정식 결제가 붙으면 이 버튼의 onClick을
 * 실제 구독 취소 API 호출로 교체하면 된다.
 */
export function CancelSubscriptionButton() {
  const { t } = useTranslation();
  const [showNotice, setShowNotice] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setShowNotice(true)}
        className="w-fit rounded-full border border-line px-4 py-2 text-sm text-muted transition hover:border-ink hover:text-ink"
      >
        {t("subscription.cancelButton")}
      </button>
      {showNotice && (
        <p className="w-fit rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {t("subscription.cancelNotReady")}
        </p>
      )}
    </div>
  );
}
