"use client";

import { useState } from "react";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

const PROVIDER_LABELS: Record<string, string> = {
  openai: "GPT (OpenAI)",
  gemini: "Gemini (Google)",
  claude: "Claude (Anthropic)",
};

/**
 * 정식 출시(유료화) 전까지 Gemini/Claude는 선택 UI에는 보이지만 실제로는
 * 쓸 수 없다 -- 골라도 부모의 provider 상태는 그대로 두고 안내 문구만
 * 띄운다(PaymentMethodModal의 "정식 출시 이후" 패턴과 동일). GPT만 실제로
 * 반영된다.
 */
const RESTRICTED_PROVIDERS = new Set(["gemini", "claude"]);

export function AiProviderSelect({
  value,
  onChange,
  providers,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  providers: string[];
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <select
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          if (RESTRICTED_PROVIDERS.has(next)) {
            setShowComingSoon(true);
            return;
          }
          setShowComingSoon(false);
          onChange(next);
        }}
        disabled={disabled}
        className="rounded-full border border-line px-3 py-1.5 text-sm disabled:opacity-50"
      >
        <option value="">{t("aiProviderSelect.auto")}</option>
        {providers.map((p) => (
          <option key={p} value={p}>
            {PROVIDER_LABELS[p] ?? p}
          </option>
        ))}
      </select>
      {showComingSoon && (
        <p className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800">{t("aiProviderSelect.comingSoon")}</p>
      )}
    </div>
  );
}
