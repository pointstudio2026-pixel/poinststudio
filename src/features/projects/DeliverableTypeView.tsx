"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DELIVERABLE_TYPE_OPTIONS } from "@/modules/projects/domain/deliverableTypes";
import { selectDeliverableType } from "@/services/project-service";
import { STEP_ROUTES } from "@/features/workspace/stepRoutes";
import { Spinner } from "@/components/Spinner";

export function DeliverableTypeView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(deliverableType: string) {
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
      setError(err instanceof Error ? err.message : "작업물 유형 선택에 실패했습니다.");
      setSelected(null);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-xl font-semibold">어떤 종류의 작업물을 만들고 싶으신가요?</h1>
        <p className="mt-1 text-sm text-neutral-500">
          선택한 유형에 따라 이후 인터뷰 질문과 진행 단계가 달라집니다.
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
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-800 hover:border-neutral-900"
              }`}
            >
              {type}
              {isSelected && isSaving && <Spinner />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
