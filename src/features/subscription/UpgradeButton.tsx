"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { upgradePlan } from "@/services/subscription-service";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import { Spinner } from "@/components/Spinner";

/**
 * 실제 PG 결제 연동 전까지의 임시 mock 액션 -- 클릭하면 결제 없이 바로
 * planCode가 바뀐다. 나중에 진짜 결제가 붙으면 이 컴포넌트의 onClick만
 * 실제 결제 흐름으로 교체하면 된다(UpgradePlanUseCase 등 백엔드는 그대로).
 */
export function UpgradeButton({ planCode }: { planCode: PlanCode }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMyStylesPopup, setShowMyStylesPopup] = useState(false);

  async function handleUpgrade() {
    setIsSubmitting(true);
    setError(null);
    try {
      const { previousPlanCode } = await upgradePlan(planCode);
      if (previousPlanCode === "free" && planCode !== "free") {
        setShowMyStylesPopup(true);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "플랜 변경에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={isSubmitting}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting && <Spinner />}
        업그레이드
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {showMyStylesPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-2 text-lg font-semibold">내 스타일 기능을 사용할 수 있어요</h2>
            <p className="text-sm text-muted">
              참고 이미지를 등록해두면 내 취향을 분석해 다음 생성에 반영해주는 내 스타일 기능이 이제 열렸습니다.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMyStylesPopup(false)}
                className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-ink"
              >
                닫기
              </button>
              <Link
                href="/my-styles"
                className="rounded-full bg-ink px-4 py-2 text-sm text-paper transition hover:opacity-90"
              >
                내 스타일 보러가기
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
