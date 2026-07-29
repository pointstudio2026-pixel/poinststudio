"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchIndustries, type IndustryDto } from "@/services/industries-service";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import { INDUSTRY_CATEGORY_LABEL_KEYS } from "@/features/interview/interviewLabels";

const SEARCH_DEBOUNCE_MS = 250;

/** 업종 선택 전용 위젯 -- 검색창 타이핑(서버사이드 locale별 + 편집거리
 * 기반 유사매칭 검색)과 대분류(19개) 클릭 드릴다운 두 방식을 모두 지원한다.
 * 선택 시 onSelect에는 반드시 industry.name(한국어 원문)을 넘겨야 한다 --
 * displayName은 화면 표시 전용이며 answers.industry에 저장되면
 * promptBuilder.ts의 문자열 매칭 계약이 깨진다. */
export function IndustryPicker({
  selectedName,
  onSelect,
}: {
  selectedName: string;
  onSelect: (industryName: string) => void;
}) {
  const { t, locale } = useTranslation();
  const [rawQuery, setRawQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [browseCategory, setBrowseCategory] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(rawQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [rawQuery]);

  // 대분류 드릴다운(및 카테고리 목록 자체)은 전체 카탈로그 1회 로드로
  // 클라이언트에서 처리한다 -- 198개는 통째로 받아도 가벼움. 검색은 대신
  // 서버(퍼지 매칭 포함)로 매 타이핑마다 보낸다.
  const catalogQuery = useQuery({
    queryKey: ["interview-industries-catalog", locale],
    queryFn: () => searchIndustries("", locale),
    staleTime: 5 * 60 * 1000,
  });

  const isSearching = debouncedQuery.length > 0;

  const searchQuery = useQuery({
    queryKey: ["interview-industries-search", locale, debouncedQuery],
    queryFn: () => searchIndustries(debouncedQuery, locale),
    enabled: isSearching,
    staleTime: 60 * 1000,
  });

  const categories = useMemo(() => {
    const list = catalogQuery.data?.industries ?? [];
    return [...new Set(list.map((i) => i.category))];
  }, [catalogQuery.data]);

  function categoryLabel(category: string): string {
    const key = INDUSTRY_CATEGORY_LABEL_KEYS[category];
    return key ? t(key) : category;
  }

  const results: IndustryDto[] = isSearching
    ? (searchQuery.data?.industries ?? [])
    : browseCategory
      ? (catalogQuery.data?.industries ?? []).filter((i) => i.category === browseCategory)
      : [];

  const showResultsList = isSearching || browseCategory !== null;

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={rawQuery}
        onChange={(e) => {
          setRawQuery(e.target.value);
          setBrowseCategory(null);
        }}
        placeholder={t("interview.industrySearchPlaceholder")}
        autoFocus
        className="rounded-full border border-line px-3 py-2"
      />

      {!isSearching && !browseCategory && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted">{t("interview.industryBrowseByCategory")}</p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setBrowseCategory(category)}
                className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-surface"
              >
                {categoryLabel(category)}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isSearching && browseCategory && (
        <button type="button" onClick={() => setBrowseCategory(null)} className="w-fit text-xs text-muted underline">
          {t("interview.industryBackToCategories")}
        </button>
      )}

      {showResultsList && (
        <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto rounded-xl border border-line p-1">
          {isSearching && searchQuery.isFetching && (
            <li className="px-3 py-2 text-sm text-muted">{t("interview.industrySearching")}</li>
          )}
          {results.map((industry) => {
            const isSelected = selectedName === industry.name;
            return (
              <li key={industry.id}>
                <button
                  type="button"
                  onClick={() => onSelect(industry.name)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                    isSelected ? "bg-ink text-paper" : "hover:bg-surface"
                  }`}
                >
                  {industry.displayName}
                  {isSelected && <span aria-hidden>✓</span>}
                </button>
              </li>
            );
          })}
          {!(isSearching && searchQuery.isFetching) && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted">{t("interview.noSearchResults")}</li>
          )}
        </ul>
      )}
    </div>
  );
}
