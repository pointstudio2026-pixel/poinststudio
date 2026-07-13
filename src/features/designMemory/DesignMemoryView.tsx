"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDesignMemory, resetDesignMemory, updateDesignMemorySettings } from "@/services/design-memory-service";
import { MOCKUP_CATEGORY_LABELS } from "@/services/mockups-service";
import { Spinner } from "@/components/Spinner";

export function DesignMemoryView() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["design-memory"],
    queryFn: fetchDesignMemory,
  });

  async function handleToggle(enabled: boolean) {
    setActionError(null);
    try {
      await updateDesignMemorySettings(enabled);
      await queryClient.invalidateQueries({ queryKey: ["design-memory"] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "설정 변경에 실패했습니다.");
    }
  }

  async function handleReset() {
    const confirmed = window.confirm(
      "지금까지 학습된 추천 데이터를 초기화하시겠습니까? 프로젝트 자체는 삭제되지 않습니다.",
    );
    if (!confirmed) return;
    setIsResetting(true);
    setActionError(null);
    try {
      await resetDesignMemory();
      await queryClient.invalidateQueries({ queryKey: ["design-memory"] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "초기화에 실패했습니다.");
    } finally {
      setIsResetting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const profile = data?.profile;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Design Memory</h1>
        <Link href="/dashboard" className="text-sm underline">
          대시보드로
        </Link>
      </header>

      <p className="text-sm text-neutral-500">
        ASTER는 회원님의 스타일 선택과 수정 패턴을 참고해 다음 프로젝트에서 더 나은 추천을 제공합니다.
        디자인을 자동으로 바꾸지 않으며, 추천만 제공합니다.
      </p>

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">설정</h2>
        <div className="mt-2 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={profile?.enabled ?? true}
              onChange={(e) => handleToggle(e.target.checked)}
            />
            개인화 추천 사용
          </label>
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {isResetting && <Spinner />}
            메모리 초기화
          </button>
        </div>
        {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
      </section>

      {!profile?.enabled && (
        <div className="rounded-md border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400">
          개인화 추천이 비활성화되어 있습니다. 위 토글을 켜면 추천이 다시 표시됩니다.
        </div>
      )}

      {profile?.enabled && profile.signalCount === 0 && (
        <div className="rounded-md border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400">
          아직 학습된 데이터가 없습니다. 프로젝트를 진행하면 추천이 쌓입니다.
        </div>
      )}

      {profile?.enabled && profile.signalCount > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-neutral-700">추천 근거</h2>

          {profile.topStyles.length > 0 && (
            <div className="rounded-md border border-neutral-200 p-4">
              <p className="text-xs font-medium text-neutral-500">자주 선택한 스타일</p>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {profile.topStyles.map((s) => (
                  <li key={s.style.id}>
                    {s.style.name} <span className="text-xs text-neutral-400">— {s.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {profile.topEditPresets.length > 0 && (
            <div className="rounded-md border border-neutral-200 p-4">
              <p className="text-xs font-medium text-neutral-500">자주 사용한 원클릭 수정</p>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {profile.topEditPresets.map((p) => (
                  <li key={p.presetKey}>
                    {p.label} <span className="text-xs text-neutral-400">— {p.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {profile.favoriteStyles.length > 0 && (
            <div className="rounded-md border border-neutral-200 p-4">
              <p className="text-xs font-medium text-neutral-500">즐겨찾기한 스타일</p>
              <p className="mt-2 text-sm">{profile.favoriteStyles.map((s) => s.name).join(", ")}</p>
            </div>
          )}

          {profile.favoriteMockupCategories.length > 0 && (
            <div className="rounded-md border border-neutral-200 p-4">
              <p className="text-xs font-medium text-neutral-500">즐겨찾기한 목업 카테고리</p>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {profile.favoriteMockupCategories.map((c) => (
                  <li key={c.category}>
                    {MOCKUP_CATEGORY_LABELS[c.category]} <span className="text-xs text-neutral-400">— {c.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(profile.preferredColors.length > 0 || profile.preferredTypography.length > 0) && (
            <div className="rounded-md border border-neutral-200 p-4">
              <p className="text-xs font-medium text-neutral-500">선호 방향성</p>
              {profile.preferredColors.length > 0 && (
                <p className="mt-1 text-sm">컬러: {profile.preferredColors.map((c) => c.value).join(", ")}</p>
              )}
              {profile.preferredTypography.length > 0 && (
                <p className="mt-1 text-sm">타이포: {profile.preferredTypography.map((t) => t.value).join(", ")}</p>
              )}
            </div>
          )}

          {profile.topIndustries.length > 0 && (
            <div className="rounded-md border border-neutral-200 p-4">
              <p className="text-xs font-medium text-neutral-500">주요 업종</p>
              <p className="mt-1 text-sm">{profile.topIndustries.map((i) => i.value).join(", ")}</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
