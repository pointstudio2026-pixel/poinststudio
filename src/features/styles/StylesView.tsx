"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchFavoriteStyles,
  fetchStyleHistory,
  fetchStyles,
  recommendStyles,
  selectStyle,
  toggleStyleFavorite,
  type StyleDto,
} from "@/services/styles-service";
import { Spinner } from "@/components/Spinner";

const MAX_SECONDARY = 2;

export function StylesView({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [secondaryIds, setSecondaryIds] = useState<string[]>([]);
  const [detailStyle, setDetailStyle] = useState<StyleDto | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const { data: recommendData, isLoading: isLoadingRecommendations } = useQuery({
    queryKey: ["style-recommendations", projectId],
    queryFn: () => recommendStyles(projectId),
  });

  const { data: browseData } = useQuery({
    queryKey: ["styles-browse", category, search],
    queryFn: () => fetchStyles({ category: category || undefined, search: search || undefined, level: 3 }),
  });

  const { data: historyData } = useQuery({
    queryKey: ["style-history", projectId],
    queryFn: () => fetchStyleHistory(projectId),
  });

  const { data: favoriteData } = useQuery({
    queryKey: ["style-favorites"],
    queryFn: fetchFavoriteStyles,
  });
  const favoriteIds = useMemo(
    () => new Set((favoriteData?.styles ?? []).map((s) => s.id)),
    [favoriteData],
  );

  async function handleToggleFavorite(styleId: string) {
    await toggleStyleFavorite(styleId, !favoriteIds.has(styleId));
    await queryClient.invalidateQueries({ queryKey: ["style-favorites"] });
  }

  function toggleSelect(style: StyleDto) {
    if (primaryId === style.id) {
      setPrimaryId(null);
      return;
    }
    if (secondaryIds.includes(style.id)) {
      setSecondaryIds(secondaryIds.filter((id) => id !== style.id));
      return;
    }
    if (!primaryId) {
      setPrimaryId(style.id);
      return;
    }
    if (secondaryIds.length < MAX_SECONDARY) {
      setSecondaryIds([...secondaryIds, style.id]);
    }
  }

  async function handleConfirmSelection() {
    if (!primaryId) return;
    setIsSelecting(true);
    setSelectError(null);
    try {
      await selectStyle(projectId, primaryId, secondaryIds);
      await queryClient.invalidateQueries({ queryKey: ["style-history", projectId] });
    } catch (err) {
      setSelectError(err instanceof Error ? err.message : "스타일 선택에 실패했습니다.");
    } finally {
      setIsSelecting(false);
    }
  }

  const allStylesById = useMemo(() => {
    const map = new Map<string, StyleDto>();
    for (const rec of recommendData?.recommendations ?? []) map.set(rec.style.id, rec.style);
    for (const s of browseData?.styles ?? []) map.set(s.id, s);
    return map;
  }, [recommendData, browseData]);

  const compareStyles = [primaryId, ...secondaryIds]
    .filter((id): id is string => Boolean(id))
    .map((id) => allStylesById.get(id))
    .filter((s): s is StyleDto => Boolean(s));

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Style Engine</h1>
          {historyData?.current && (
            <p className="mt-1 text-xs text-neutral-400">
              최근 선택: {allStylesById.get(historyData.current.primaryStyleId)?.name ?? historyData.current.primaryStyleId} ·{" "}
              {new Date(historyData.current.createdAt).toLocaleString("ko-KR")}
            </p>
          )}
        </div>
        <Link href={`/projects/${projectId}`} className="text-sm underline">
          프로젝트로
        </Link>
      </header>

      <section>
        <h2 className="text-sm font-medium text-neutral-700">추천 스타일</h2>
        {isLoadingRecommendations ? (
          <div className="mt-4 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(recommendData?.recommendations ?? []).map(({ style, score, reason }) => (
              <StyleCard
                key={style.id}
                style={style}
                score={score}
                reason={reason}
                isPrimary={primaryId === style.id}
                isSecondary={secondaryIds.includes(style.id)}
                isFavorite={favoriteIds.has(style.id)}
                onSelect={() => toggleSelect(style)}
                onDetail={() => setDetailStyle(style)}
                onFavorite={() => handleToggleFavorite(style.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-700">스타일 둘러보기</h2>
        </div>
        <div className="mt-2 flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
          >
            <option value="">전체 카테고리</option>
            {(recommendData?.recommendations ?? [])
              .map((r) => r.style.category)
              .filter((c, i, arr) => arr.indexOf(c) === i)
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="스타일 검색"
            className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          {(browseData?.styles ?? []).map((style) => (
            <StyleCard
              key={style.id}
              style={style}
              isPrimary={primaryId === style.id}
              isSecondary={secondaryIds.includes(style.id)}
              isFavorite={favoriteIds.has(style.id)}
              onSelect={() => toggleSelect(style)}
              onDetail={() => setDetailStyle(style)}
              onFavorite={() => handleToggleFavorite(style.id)}
              compact
            />
          ))}
        </div>
      </section>

      {compareStyles.length > 0 && (
        <section className="rounded-md border border-neutral-200 p-4">
          <h2 className="text-sm font-medium text-neutral-700">선택 비교</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {compareStyles.map((style) => (
              <div key={style.id} className="rounded-md border border-neutral-200 p-3 text-sm">
                <p className="font-medium">
                  {style.name} {style.id === primaryId ? "(Primary)" : "(Secondary)"}
                </p>
                <p className="mt-1 text-xs text-neutral-500">{style.description}</p>
              </div>
            ))}
          </div>
          {selectError && <p className="mt-2 text-sm text-red-600">{selectError}</p>}
          <button
            type="button"
            onClick={handleConfirmSelection}
            disabled={!primaryId || isSelecting}
            className="mt-4 flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {isSelecting && <Spinner />}
            이 스타일로 선택 확정
          </button>
        </section>
      )}

      {detailStyle && (
        <div
          className="fixed inset-0 flex items-center justify-end bg-black/30"
          onClick={() => setDetailStyle(null)}
        >
          <div
            className="h-full w-full max-w-sm overflow-y-auto bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => setDetailStyle(null)} className="text-sm underline">
              닫기
            </button>
            <h3 className="mt-4 text-lg font-semibold">{detailStyle.name}</h3>
            <p className="mt-1 text-xs text-neutral-400">{detailStyle.category}</p>
            <p className="mt-3 text-sm">{detailStyle.description}</p>
            <p className="mt-3 text-xs text-neutral-500">{detailStyle.keywords.join(", ")}</p>
          </div>
        </div>
      )}
    </main>
  );
}

function StyleCard({
  style,
  score,
  reason,
  isPrimary,
  isSecondary,
  isFavorite,
  onSelect,
  onDetail,
  onFavorite,
  compact,
}: {
  style: StyleDto;
  score?: number;
  reason?: string;
  isPrimary: boolean;
  isSecondary: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onDetail: () => void;
  onFavorite: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-3 text-sm ${
        isPrimary
          ? "border-neutral-900 bg-neutral-50"
          : isSecondary
            ? "border-neutral-500 bg-neutral-50"
            : "border-neutral-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <button type="button" onClick={onDetail} className="text-left font-medium underline-offset-2 hover:underline">
          {style.name}
        </button>
        <button type="button" onClick={onFavorite} aria-label="즐겨찾기">
          {isFavorite ? "★" : "☆"}
        </button>
      </div>
      <p className="mt-1 text-xs text-neutral-400">{style.category}</p>
      {!compact && score !== undefined && (
        <p className="mt-1 text-xs text-neutral-500">점수 {Math.round(score * 100)}%</p>
      )}
      {!compact && reason && <p className="mt-1 text-xs text-neutral-500">{reason}</p>}
      <button
        type="button"
        onClick={onSelect}
        className="mt-2 rounded-md border border-neutral-300 px-2 py-1 text-xs"
      >
        {isPrimary ? "Primary 선택됨" : isSecondary ? "Secondary 선택됨" : "선택"}
      </button>
    </div>
  );
}
