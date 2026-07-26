"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DELIVERABLE_TYPE_OPTIONS } from "@/modules/projects/domain/deliverableTypes";
import { DELIVERABLE_TYPE_LABEL_KEYS } from "@/features/projects/deliverableTypeLabels";
import { selectDeliverableType } from "@/services/project-service";
import { STEP_ROUTES } from "@/features/workspace/stepRoutes";
import { Spinner } from "@/components/Spinner";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

export function DeliverableTypeView({
  projectId,
  currentDeliverableType,
}: {
  projectId: string;
  currentDeliverableType: string | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(currentDeliverableType);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(deliverableType: string) {
    // 유형을 다시 선택(변경)하는 경우 -- 이미 이 유형으로 인터뷰/스타일/이미지
    // 생성까지 진행했을 수 있는데, 유형을 바꿔도 그 결과물들은 전혀
    // 무효화/재생성되지 않고 그대로 남는다(실제 버그 리포트로 확인됨: 앱
    // 디자인으로 생성한 목업 이미지가 이후 브랜딩 & 로고로 유형을 바꾼 뒤에도
    // 그대로 보여 혼란을 준 사례). 자동으로 지우지는 않고, 사용자에게 명확히
    // 경고한 뒤 계속할지 직접 선택하게 한다.
    if (currentDeliverableType && currentDeliverableType !== deliverableType) {
      const confirmed = window.confirm(t("deliverableType.changeWarning"));
      if (!confirmed) return;
    }

    setSelected(deliverableType);
    setIsSaving(true);
    setError(null);
    try {
      await selectDeliverableType(projectId, deliverableType);
      // deliverableType이 방금 바뀌었으므로, 이 값을 읽는 상위 layout.tsx
      // (사이드바 단계 목록)가 이동한 뒤에도 캐시된 값을 재사용하지 않도록
      // 이동 직후 다시 서버에서 가져오게 한다 -- 안 그러면 잠깐 잘못된
      // (이전 유형 기준) 단계 목록이 보인다.
      router.push(`/projects/${projectId}/${STEP_ROUTES.brand_interview}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("deliverableType.selectFailed"));
      setSelected(null);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-xl font-semibold">{t("deliverableType.title")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("deliverableType.subtitle")}
        </p>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {DELIVERABLE_TYPE_OPTIONS.map((type) => {
          const isSelected = selected === type;
          return (
            <button
              key={type}
              type="button"
              disabled={isSaving}
              onClick={() => handleSelect(type)}
              className={`flex items-center justify-between rounded-2xl border px-5 py-4 text-left text-sm font-medium transition disabled:opacity-50 ${
                isSelected
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink hover:border-ink"
              }`}
            >
              {t(DELIVERABLE_TYPE_LABEL_KEYS[type] ?? "deliverableType.title")}
              {isSelected && isSaving && <Spinner />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
