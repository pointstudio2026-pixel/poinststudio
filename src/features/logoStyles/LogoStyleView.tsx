"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchLogoStyleCategories,
  recommendLogoStyle,
  selectLogoStyle,
  type LogoStyleCategoryDto,
  type LogoStyleRecommendationDto,
} from "@/services/logo-styles-service";
import { Spinner } from "@/components/Spinner";
import { NextStepButton } from "@/features/workspace/NextStepButton";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

const MAX_ADVANCED_SELECTIONS = 3;

function Stars({ count }: { count: number }) {
  const { t } = useTranslation();
  return (
    <span className="text-amber-500" aria-label={t("logoStyle.starsLabel", { count })}>
      {"★".repeat(count)}
      <span className="text-neutral-300">{"★".repeat(5 - count)}</span>
    </span>
  );
}

export function LogoStyleView({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const [advancedMode, setAdvancedMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);
  const [selected, setSelected] = useState(false);

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["logo-style-categories"],
    queryFn: fetchLogoStyleCategories,
  });

  const { data: recommendData, isLoading: isLoadingRecommend, isError: isRecommendError, error: recommendError } = useQuery({
    queryKey: ["logo-style-recommend", projectId],
    queryFn: () => recommendLogoStyle(projectId),
    retry: false,
  });

  const categories = useMemo(() => categoriesData?.categories ?? [], [categoriesData]);
  const ranked = recommendData?.recommendations ?? [];
  const topPick = ranked[0];
  const topThree = ranked.slice(0, 3);

  function toggleSelect(categoryId: string) {
    setSelectError(null);
    if (!advancedMode) {
      setSelectedIds([categoryId]);
      return;
    }
    setSelectedIds((prev) => {
      if (prev.includes(categoryId)) return prev.filter((id) => id !== categoryId);
      if (prev.length >= MAX_ADVANCED_SELECTIONS) return prev;
      return [...prev, categoryId];
    });
  }

  function toggleAdvancedMode() {
    setAdvancedMode((prev) => {
      const next = !prev;
      if (!next && selectedIds.length > 1) {
        setSelectedIds(selectedIds.slice(0, 1));
      }
      return next;
    });
  }

  async function handleConfirm() {
    if (selectedIds.length === 0) return;
    setIsSelecting(true);
    setSelectError(null);
    try {
      await selectLogoStyle(projectId, selectedIds);
      setSelected(true);
    } catch (err) {
      setSelectError(err instanceof Error ? err.message : t("logoStyle.selectFailed"));
    } finally {
      setIsSelecting(false);
    }
  }

  const categoriesById = useMemo(() => {
    const map = new Map<string, LogoStyleCategoryDto>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  if (isLoadingCategories || isLoadingRecommend) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (isRecommendError) {
    const notReady = recommendError instanceof Error && recommendError.message.includes("먼저 선택");
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-center">
        <h1 className="text-lg font-medium">
          {notReady ? t("logoStyle.strategyFirstTitle") : t("logoStyle.recommendLoadFailedTitle")}
        </h1>
        <p className="text-sm text-neutral-400">
          {notReady && t("logoStyle.strategyFirstBody")}
        </p>
      </div>
    );
  }

  if (selected) {
    const chosen = selectedIds.map((id) => categoriesById.get(id)).filter((c): c is LogoStyleCategoryDto => Boolean(c));
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold">{t("logoStyle.selectedTitle")}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {t("logoStyle.selectedBody", { names: chosen.map((c) => c.name).join(", ") })}
          </p>
        </div>
        <div>
          <NextStepButton projectId={projectId} currentStepKey="logo_style" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-xl font-semibold">{t("logoStyle.headerTitle")}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {t("logoStyle.headerBody")}
        </p>
      </header>

      {topPick && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
            <Stars count={5} />
            <span>{t("logoStyle.aiRecommendBadge")}</span>
          </div>
          <p className="mt-2 text-sm text-neutral-700">
            {t("logoStyle.topPickReasonPrefix")} <strong>&ldquo;{topPick.category.name}&rdquo;</strong>{t("logoStyle.topPickReasonSuffix")}
          </p>
          <p className="mt-1 text-sm text-neutral-500">{topPick.reason}</p>
        </section>
      )}

      <div className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3">
        <div>
          <p className="text-sm font-medium">{t("logoStyle.advancedOptions")}</p>
          <p className="text-xs text-neutral-400">{t("logoStyle.advancedOptionsBody", { max: MAX_ADVANCED_SELECTIONS })}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={advancedMode}
          onClick={toggleAdvancedMode}
          className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
            advancedMode ? "bg-neutral-900" : "bg-neutral-200"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              advancedMode ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {selectError && <p className="text-sm text-red-600">{selectError}</p>}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <LogoStyleCard
            key={category.id}
            category={category}
            isSelected={selectedIds.includes(category.id)}
            onSelect={() => toggleSelect(category.id)}
          />
        ))}

        {topThree.length > 0 && (
          <AiRecommendedCard
            topThree={topThree}
            isSelected={Boolean(topPick && selectedIds.includes(topPick.category.id))}
            onSelect={() => topPick && toggleSelect(topPick.category.id)}
          />
        )}
      </div>

      <div className="sticky bottom-6 flex justify-end">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selectedIds.length === 0 || isSelecting}
          className="flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:opacity-90 disabled:opacity-40"
        >
          {isSelecting && <Spinner />}
          {selectedIds.length > 0
            ? t("logoStyle.generateWithCount", { count: selectedIds.length })
            : t("logoStyle.pleaseSelect")}
        </button>
      </div>
    </div>
  );
}

function LogoStyleCard({
  category,
  isSelected,
  onSelect,
}: {
  category: LogoStyleCategoryDto;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
        isSelected ? "border-neutral-900 ring-2 ring-neutral-900" : "border-neutral-200 hover:border-neutral-400"
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={category.sampleImageUrl}
          alt={category.name}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
        {isSelected && (
          <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-white shadow">
            ✓
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-base font-semibold">{category.name}</h3>
          <p className="mt-1 text-sm text-neutral-500">{category.description}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {category.subStyles.map((s) => (
            <span key={s} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
              {s}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={onSelect}
          className={`mt-auto rounded-full px-4 py-2 text-sm font-medium transition ${
            isSelected
              ? "bg-neutral-900 text-white"
              : "border border-neutral-300 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900"
          }`}
        >
          {isSelected ? t("logoStyle.selected") : t("logoStyle.select")}
        </button>
      </div>
    </div>
  );
}

function AiRecommendedCard({
  topThree,
  isSelected,
  onSelect,
}: {
  topThree: LogoStyleRecommendationDto[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
        isSelected ? "border-amber-500 ring-2 ring-amber-500" : "border-amber-200 hover:border-amber-400"
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-amber-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-styles/ai-recommended.png"
          alt={t("logoStyle.aiRecommendBadge")}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
        {isSelected && (
          <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white shadow">
            ✓
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-base font-semibold">{t("logoStyle.aiRecommendBadge")}</h3>
          <p className="mt-1 text-sm text-neutral-500">{t("logoStyle.aiRecommendedDescription")}</p>
        </div>
        <ul className="flex flex-col gap-1 text-sm">
          {topThree.map((r, i) => (
            <li key={r.category.id} className="flex items-center justify-between">
              <span>{r.representativeSubStyle}</span>
              <Stars count={i === 0 ? 5 : 4} />
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onSelect}
          className={`mt-auto rounded-full px-4 py-2 text-sm font-medium transition ${
            isSelected
              ? "bg-amber-500 text-white"
              : "border border-amber-300 text-amber-700 hover:border-amber-500 hover:text-amber-900"
          }`}
        >
          {isSelected ? t("logoStyle.selected") : t("logoStyle.selectTopPick")}
        </button>
      </div>
    </div>
  );
}
