"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  fetchFavoriteStyles,
  fetchStyles,
  recommendStyles,
  selectStyle,
  toggleStyleFavorite,
  type StyleDto,
} from "@/services/styles-service";
import { fetchUserStyleCategories, selectProjectUserStyle, userStyleReferenceImageUrl } from "@/services/user-styles-service";
import { fetchColorPalettes, selectColorPalette, type ColorSwatchDto } from "@/services/color-palette-service";
import { cmykToHex } from "@/modules/colorPalettes/domain/cmykToHex";
import { fetchInterview } from "@/services/interview-service";
import { suggestColorSwatchesFromNotes } from "@/modules/colorPalettes/domain/interviewColorSuggestion";
import { Spinner } from "@/components/Spinner";
import { NextStepButton } from "@/features/workspace/NextStepButton";

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

/**
 * 스와치 하나당 색상 입력 방식 3가지(피커/HEX 텍스트/CMYK 텍스트)를 제공한다.
 * 피커는 기존처럼 고르는 즉시 반영되지만, HEX/CMYK는 "확인" 버튼을 눌러야
 * 반영된다 -- 텍스트를 다 입력하기 전에 중간 상태로 스와치가 바뀌는 걸 막기
 * 위함(사용자 요청 흐름).
 */
function CustomSwatchEditor({
  index,
  swatch,
  onChangeLabel,
  onConfirmHex,
}: {
  index: number;
  swatch: ColorSwatchDto;
  onChangeLabel: (label: string) => void;
  onConfirmHex: (hex: string) => void;
}) {
  const [mode, setMode] = useState<"hex" | "cmyk" | null>(null);
  const [hexDraft, setHexDraft] = useState(swatch.hex);
  const [cmykDraft, setCmykDraft] = useState({ c: "", m: "", y: "", k: "" });
  const [error, setError] = useState<string | null>(null);

  function confirmHex() {
    if (!HEX_PATTERN.test(hexDraft)) {
      setError("#RRGGBB 형식(6자리)으로 입력해주세요.");
      return;
    }
    setError(null);
    onConfirmHex(hexDraft);
  }

  function confirmCmyk() {
    const values = [cmykDraft.c, cmykDraft.m, cmykDraft.y, cmykDraft.k].map(Number);
    if (values.some((v) => Number.isNaN(v) || v < 0 || v > 100)) {
      setError("C/M/Y/K는 0~100 사이 숫자로 입력해주세요.");
      return;
    }
    setError(null);
    const [c, m, y, k] = values as [number, number, number, number];
    onConfirmHex(cmykToHex(c, m, y, k));
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-neutral-100 p-2">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={swatch.hex}
          onChange={(e) => onConfirmHex(e.target.value)}
          className="h-7 w-9 rounded border border-neutral-300"
          aria-label={`색상 ${index + 1} 피커`}
        />
        <input
          type="text"
          value={swatch.label}
          onChange={(e) => onChangeLabel(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-2 py-1 text-xs"
          placeholder="색상 이름"
        />
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setMode(mode === "hex" ? null : "hex")}
          className={`rounded border px-1.5 py-0.5 text-[11px] ${mode === "hex" ? "border-neutral-900" : "border-neutral-300"}`}
        >
          HEX 입력
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "cmyk" ? null : "cmyk")}
          className={`rounded border px-1.5 py-0.5 text-[11px] ${mode === "cmyk" ? "border-neutral-900" : "border-neutral-300"}`}
        >
          CMYK 입력
        </button>
      </div>
      {mode === "hex" && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={hexDraft}
            onChange={(e) => setHexDraft(e.target.value)}
            placeholder="#RRGGBB"
            className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-xs"
          />
          <button type="button" onClick={confirmHex} className="rounded-md border border-neutral-300 px-2 py-1 text-xs">
            확인
          </button>
        </div>
      )}
      {mode === "cmyk" && (
        <div className="flex items-center gap-1">
          {(["c", "m", "y", "k"] as const).map((key) => (
            <input
              key={key}
              type="number"
              min={0}
              max={100}
              value={cmykDraft[key]}
              onChange={(e) => setCmykDraft((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={key.toUpperCase()}
              className="w-12 rounded-md border border-neutral-300 px-1 py-1 text-xs"
            />
          ))}
          <button type="button" onClick={confirmCmyk} className="rounded-md border border-neutral-300 px-2 py-1 text-xs">
            확인
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

const DEFAULT_CUSTOM_SWATCHES: ColorSwatchDto[] = [
  { hex: "#111827", label: "색상 1" },
  { hex: "#6b7280", label: "색상 2" },
  { hex: "#f3f4f6", label: "색상 3" },
];

const MAX_SECONDARY = 2;

export function StylesView({
  projectId,
  deliverableType,
}: {
  projectId: string;
  deliverableType: string | null;
}) {
  const queryClient = useQueryClient();
  const [browseL1, setBrowseL1] = useState<StyleDto | null>(null);
  const [browseL2, setBrowseL2] = useState<StyleDto | null>(null);
  const [search, setSearch] = useState("");
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [secondaryIds, setSecondaryIds] = useState<string[]>([]);
  const [detailStyle, setDetailStyle] = useState<StyleDto | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selected, setSelected] = useState(false);
  const [selectedUserStyleId, setSelectedUserStyleId] = useState<string | null>(null);
  const [userStyleError, setUserStyleError] = useState<string | null>(null);
  const [isSelectingUserStyle, setIsSelectingUserStyle] = useState(false);
  const [selectedPaletteSlug, setSelectedPaletteSlug] = useState<string | null>(null);
  const [isCustomColorSelected, setIsCustomColorSelected] = useState(false);
  const [showCustomColorForm, setShowCustomColorForm] = useState(false);
  const [customSwatches, setCustomSwatches] = useState<ColorSwatchDto[]>(DEFAULT_CUSTOM_SWATCHES);
  const [colorError, setColorError] = useState<string | null>(null);
  const [isSelectingColor, setIsSelectingColor] = useState(false);
  const [colorSuggestionDismissed, setColorSuggestionDismissed] = useState(false);
  const [forbiddenColorsInput, setForbiddenColorsInput] = useState("");
  const [forbiddenColors, setForbiddenColors] = useState<string[]>([]);

  const { data: recommendData, isLoading: isLoadingRecommendations } = useQuery({
    queryKey: ["style-recommendations", projectId],
    queryFn: () => recommendStyles(projectId),
  });

  // 대분류(레벨1) 목록 -- 어떤 필터를 걸든 categories 필드는 항상 전체
  // 대분류를 반환하므로 한 번만 가져오면 된다.
  const { data: categoriesData } = useQuery({
    queryKey: ["styles-categories"],
    queryFn: () => fetchStyles({ level: 1 }),
  });
  const l1Categories = categoriesData?.categories ?? [];

  // 대분류 선택 시 그 아래 중분류(레벨2) 목록.
  const { data: l2Data } = useQuery({
    queryKey: ["styles-browse-l2", browseL1?.id],
    queryFn: () => fetchStyles({ level: 2, parentId: browseL1!.id }),
    enabled: Boolean(browseL1),
  });

  // 검색어가 있으면 검색어 기준으로, 아니면 선택된 중분류 아래 소분류
  // (레벨3, 실제로 고를 수 있는 스타일)를 보여준다.
  const { data: browseData } = useQuery({
    queryKey: ["styles-browse-l3", browseL2?.id, search],
    queryFn: () =>
      fetchStyles(search ? { level: 3, search } : { level: 3, parentId: browseL2!.id }),
    enabled: Boolean(search) || Boolean(browseL2),
  });

  const { data: favoriteData } = useQuery({
    queryKey: ["style-favorites"],
    queryFn: fetchFavoriteStyles,
  });

  const { data: userStyleData } = useQuery({
    queryKey: ["user-style-categories"],
    queryFn: fetchUserStyleCategories,
  });
  const userStyleCategories = userStyleData?.categories ?? [];

  const { data: colorPaletteData } = useQuery({
    queryKey: ["color-palettes"],
    queryFn: fetchColorPalettes,
  });
  const colorPalettes = colorPaletteData?.palettes ?? [];
  const favoriteIds = useMemo(
    () => new Set((favoriteData?.styles ?? []).map((s) => s.id)),
    [favoriteData],
  );

  // 인터뷰 서술형 답변(additionalNotes)에 색상이 언급되어 있으면 컬러
  // 선택에 제안으로 띄운다 -- 이미 완료된 인터뷰를 다시 조회해도 부작용
  // 없음(GetOrStartInterviewUseCase는 기존 인터뷰를 그대로 반환).
  const { data: interviewData } = useQuery({
    queryKey: ["interview", projectId],
    queryFn: () => fetchInterview(projectId),
  });
  const additionalNotesText = useMemo(
    () => interviewData?.interview.answers.find((a) => a.questionKey === "additionalNotes")?.answer ?? null,
    [interviewData],
  );
  const suggestedColorSwatches = useMemo(
    () => suggestColorSwatchesFromNotes(additionalNotesText),
    [additionalNotesText],
  );
  const showColorSuggestion =
    Boolean(suggestedColorSwatches) &&
    !selectedPaletteSlug &&
    !isCustomColorSelected &&
    !colorSuggestionDismissed;

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

  function selectL1(l1: StyleDto) {
    setBrowseL1(l1);
    setBrowseL2(null);
    setSearch("");
  }

  function selectL2(l2: StyleDto) {
    setBrowseL2(l2);
    setSearch("");
  }

  function clearSearch() {
    setSearch("");
  }

  async function handleConfirmSelection() {
    if (!primaryId) return;
    setIsSelecting(true);
    setSelectError(null);
    try {
      await selectStyle(projectId, primaryId, secondaryIds);
      await queryClient.invalidateQueries({ queryKey: ["style-history", projectId] });
      setSelected(true);
    } catch (err) {
      setSelectError(err instanceof Error ? err.message : "스타일 선택에 실패했습니다.");
    } finally {
      setIsSelecting(false);
    }
  }

  async function handleSelectUserStyle(categoryId: string) {
    setIsSelectingUserStyle(true);
    setUserStyleError(null);
    try {
      await selectProjectUserStyle(projectId, categoryId);
      setSelectedUserStyleId(categoryId);
    } catch (err) {
      setUserStyleError(err instanceof Error ? err.message : "내 스타일 선택에 실패했습니다.");
    } finally {
      setIsSelectingUserStyle(false);
    }
  }

  async function handleSelectColorPreset(slug: string) {
    setIsSelectingColor(true);
    setColorError(null);
    try {
      await selectColorPalette(projectId, { presetSlug: slug, forbiddenColors });
      setSelectedPaletteSlug(slug);
      setIsCustomColorSelected(false);
      setShowCustomColorForm(false);
    } catch (err) {
      setColorError(err instanceof Error ? err.message : "컬러 팔레트 선택에 실패했습니다.");
    } finally {
      setIsSelectingColor(false);
    }
  }

  function parseForbiddenColorsInput(text: string): string[] {
    return text
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^#[0-9a-fA-F]{6}$/.test(s));
  }

  async function handleApplyForbiddenColors() {
    const parsed = parseForbiddenColorsInput(forbiddenColorsInput);
    setColorError(null);
    if (!selectedPaletteSlug && !isCustomColorSelected) {
      // 아직 팔레트를 선택하지 않았으면 목록만 로컬에 저장해두고, 팔레트를
      // 선택하는 시점(handleSelectColorPreset/handleConfirmCustomColor)에
      // 함께 전송한다.
      setForbiddenColors(parsed);
      return;
    }
    setIsSelectingColor(true);
    try {
      if (selectedPaletteSlug) {
        await selectColorPalette(projectId, { presetSlug: selectedPaletteSlug, forbiddenColors: parsed });
      } else {
        await selectColorPalette(projectId, { customSwatches, forbiddenColors: parsed });
      }
      setForbiddenColors(parsed);
    } catch (err) {
      setColorError(err instanceof Error ? err.message : "제외할 색상 저장에 실패했습니다.");
    } finally {
      setIsSelectingColor(false);
    }
  }

  function updateCustomSwatch(index: number, patch: Partial<ColorSwatchDto>) {
    setCustomSwatches((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function handleApplyColorSuggestion() {
    if (!suggestedColorSwatches) return;
    setCustomSwatches(suggestedColorSwatches);
    setShowCustomColorForm(true);
    setColorSuggestionDismissed(true);
  }

  function handleDismissColorSuggestion() {
    setColorSuggestionDismissed(true);
  }

  async function handleConfirmCustomColor() {
    setIsSelectingColor(true);
    setColorError(null);
    try {
      await selectColorPalette(projectId, { customSwatches, forbiddenColors });
      setSelectedPaletteSlug(null);
      setIsCustomColorSelected(true);
    } catch (err) {
      setColorError(err instanceof Error ? err.message : "컬러 팔레트 선택에 실패했습니다.");
    } finally {
      setIsSelectingColor(false);
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
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">스타일</h1>
        </div>

        {primaryId && (
          <div className="sticky top-20 z-10 flex flex-shrink-0 items-center gap-3 rounded-full border border-line bg-surface px-4 py-2 shadow-soft">
            <span className="text-sm">
              {compareStyles[0]?.name}
              {compareStyles.length > 1 && ` 외 ${compareStyles.length - 1}개`} 선택됨
            </span>
            <button
              type="button"
              onClick={handleConfirmSelection}
              disabled={isSelecting}
              className="flex items-center gap-2 rounded-full bg-ink px-4 py-1.5 text-sm text-paper transition hover:opacity-90 disabled:opacity-50"
            >
              {isSelecting && <Spinner />}
              선택 확정
            </button>
          </div>
        )}
      </header>
      {selectError && <p className="text-sm text-red-600">{selectError}</p>}
      {selected && (
        <div className="flex items-center gap-3 rounded-md border border-line bg-surface p-4">
          <p className="text-sm text-muted">스타일이 선택되었습니다.</p>
          <NextStepButton projectId={projectId} currentStepKey="style" deliverableType={deliverableType} />
        </div>
      )}

      <section className="rounded-md border border-neutral-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-700">내 스타일에서 선택 (선택 사항)</h2>
          <Link href="/my-styles" className="text-xs underline">
            내 스타일 관리하기 →
          </Link>
        </div>
        {userStyleError && <p className="mt-2 text-sm text-red-600">{userStyleError}</p>}
        {userStyleCategories.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-400">
            아직 등록한 스타일이 없습니다. 내 스타일에서 참고 이미지를 추가해보세요.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {userStyleCategories.map((category) => (
              <div
                key={category.id}
                className={`rounded-md border p-3 text-sm ${
                  selectedUserStyleId === category.id ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"
                }`}
              >
                <div className="flex gap-1">
                  {category.references.slice(0, 3).map((ref) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={ref.id}
                      src={userStyleReferenceImageUrl(ref.id)}
                      alt=""
                      className="h-12 w-12 rounded-sm object-cover"
                    />
                  ))}
                </div>
                <p className="mt-2 font-medium">{category.name}</p>
                <button
                  type="button"
                  onClick={() => handleSelectUserStyle(category.id)}
                  disabled={isSelectingUserStyle}
                  className="mt-2 rounded-md border border-neutral-300 px-2 py-1 text-xs disabled:opacity-50"
                >
                  {selectedUserStyleId === category.id ? "선택됨" : "선택"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">브랜드 컬러 선택 (선택 사항)</h2>
        <p className="mt-1 text-xs text-neutral-400">
          미리 골라두면 실제 이미지 생성에 이 색상이 정확히 반영되고, 컨셉 보드의 컬러
          팔레트도 이 색으로 표시됩니다.
        </p>
        {colorError && <p className="mt-2 text-sm text-red-600">{colorError}</p>}

        {showColorSuggestion && suggestedColorSwatches && (
          <div className="mt-3 rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3">
            <p className="text-xs font-medium text-neutral-700">
              인터뷰에 남겨주신 내용에서 이런 색상을 찾았어요. 적용하면 직접 수정할 수 있는 화면으로 이동합니다.
            </p>
            <div className="mt-2 flex gap-3">
              {suggestedColorSwatches.map((swatch) => (
                <div key={swatch.hex} className="flex flex-col items-center gap-1">
                  <div
                    className="h-8 w-8 rounded-sm border border-neutral-200"
                    style={{ backgroundColor: swatch.hex }}
                    title={swatch.label}
                  />
                  <span className="text-[10px] text-neutral-500">{swatch.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleApplyColorSuggestion}
                className="rounded-md bg-neutral-900 px-2 py-1 text-xs text-white"
              >
                적용
              </button>
              <button
                type="button"
                onClick={handleDismissColorSuggestion}
                className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
              >
                무시
              </button>
            </div>
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {colorPalettes.map((palette) => (
            <div
              key={palette.slug}
              className={`rounded-md border p-3 text-sm ${
                selectedPaletteSlug === palette.slug ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"
              }`}
            >
              <div className="flex gap-1">
                {palette.swatches.map((swatch) => (
                  <div
                    key={swatch.hex}
                    className="h-8 w-8 rounded-sm border border-neutral-200"
                    style={{ backgroundColor: swatch.hex }}
                    title={swatch.label}
                  />
                ))}
              </div>
              <p className="mt-2 font-medium">{palette.name}</p>
              <button
                type="button"
                onClick={() => handleSelectColorPreset(palette.slug)}
                disabled={isSelectingColor}
                className="mt-2 rounded-md border border-neutral-300 px-2 py-1 text-xs disabled:opacity-50"
              >
                {selectedPaletteSlug === palette.slug ? "선택됨" : "선택"}
              </button>
            </div>
          ))}

          <div
            className={`rounded-md border p-3 text-sm ${
              isCustomColorSelected ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"
            }`}
          >
            <p className="font-medium">직접 입력</p>
            <p className="mt-1 text-xs text-neutral-400">원하는 색상을 직접 골라보세요.</p>
            {!showCustomColorForm ? (
              <button
                type="button"
                onClick={() => setShowCustomColorForm(true)}
                className="mt-2 rounded-md border border-neutral-300 px-2 py-1 text-xs"
              >
                {isCustomColorSelected ? "선택됨 · 수정" : "직접 입력"}
              </button>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                {customSwatches.map((swatch, index) => (
                  <CustomSwatchEditor
                    key={index}
                    index={index}
                    swatch={swatch}
                    onChangeLabel={(label) => updateCustomSwatch(index, { label })}
                    onConfirmHex={(hex) => updateCustomSwatch(index, { hex })}
                  />
                ))}
                <button
                  type="button"
                  onClick={handleConfirmCustomColor}
                  disabled={isSelectingColor}
                  className="rounded-md bg-neutral-900 px-2 py-1 text-xs text-white disabled:opacity-50"
                >
                  {isSelectingColor && <Spinner />}
                  이 색상으로 선택
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 border-t border-neutral-100 pt-3">
          <h3 className="text-xs font-medium text-neutral-700">절대 사용하면 안 되는 색상 (선택 사항)</h3>
          <p className="mt-1 text-xs text-neutral-400">
            HEX 코드를 쉼표로 구분해 입력하면(예: #ff0000, #000000) 이미지 생성 시 해당 색상을 절대 사용하지 않습니다.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={forbiddenColorsInput}
              onChange={(e) => setForbiddenColorsInput(e.target.value)}
              placeholder="#ff0000, #000000"
              className="min-w-[220px] flex-1 rounded-md border border-neutral-300 px-2 py-1 text-xs"
            />
            <button
              type="button"
              onClick={handleApplyForbiddenColors}
              disabled={isSelectingColor}
              className="rounded-md border border-neutral-300 px-2 py-1 text-xs disabled:opacity-50"
            >
              적용
            </button>
          </div>
          {forbiddenColors.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {forbiddenColors.map((hex) => (
                <div key={hex} className="flex items-center gap-1 rounded-full border border-neutral-200 px-2 py-0.5">
                  <div className="h-3 w-3 rounded-full border border-neutral-200" style={{ backgroundColor: hex }} />
                  <span className="text-[10px] text-neutral-500">{hex}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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
        <h2 className="text-sm font-medium text-neutral-700">스타일 둘러보기</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="스타일 검색"
          className="mt-2 w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />

        {search ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
            <span>&ldquo;{search}&rdquo; 검색 결과</span>
            <button type="button" onClick={clearSearch} className="underline">
              검색 지우고 카테고리로 보기
            </button>
          </div>
        ) : (
          <>
            {/* 대분류 */}
            <div className="mt-3 flex flex-wrap gap-2">
              {l1Categories.map((l1) => (
                <button
                  key={l1.id}
                  type="button"
                  onClick={() => selectL1(l1)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    browseL1?.id === l1.id
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {l1.name}
                </button>
              ))}
            </div>

            {/* 중분류 */}
            {browseL1 && (
              <div className="mt-2 flex flex-wrap gap-2 border-l-2 border-neutral-100 pl-3">
                {(l2Data?.styles ?? []).map((l2) => (
                  <button
                    key={l2.id}
                    type="button"
                    onClick={() => selectL2(l2)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      browseL2?.id === l2.id
                        ? "border-neutral-700 bg-neutral-700 text-white"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                    }`}
                  >
                    {l2.name}
                  </button>
                ))}
              </div>
            )}

            {/* 현재 위치(breadcrumb) */}
            {(browseL1 || browseL2) && (
              <p className="mt-2 text-xs text-neutral-400">
                {browseL1?.name}
                {browseL2 && ` > ${browseL2.name}`}
              </p>
            )}
          </>
        )}

        {/* 소분류(선택 가능한 실제 스타일) */}
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
          {!search && browseL1 && !browseL2 && (
            <p className="col-span-4 text-sm text-neutral-400">중분류를 선택하면 스타일이 나타납니다.</p>
          )}
          {!search && !browseL1 && (
            <p className="col-span-4 text-sm text-neutral-400">대분류를 선택해서 스타일을 둘러보세요.</p>
          )}
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
        </section>
      )}

      {/* 페이지를 끝까지 내려온 사용자를 위해 상단과 동일한 확정/다음 단계
          버튼을 하단에도 한 번 더 노출한다 -- 위쪽 sticky 버튼과 같은
          selected/primaryId 상태를 그대로 참조한다. */}
      {primaryId && (
        <div className="flex flex-col items-start gap-3 rounded-md border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm">
            {compareStyles[0]?.name}
            {compareStyles.length > 1 && ` 외 ${compareStyles.length - 1}개`} 선택됨
          </span>
          <button
            type="button"
            onClick={handleConfirmSelection}
            disabled={isSelecting}
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-1.5 text-sm text-paper transition hover:opacity-90 disabled:opacity-50"
          >
            {isSelecting && <Spinner />}
            선택 확정
          </button>
        </div>
      )}
      {selected && (
        <div className="flex items-center gap-3 rounded-md border border-line bg-surface p-4">
          <p className="text-sm text-muted">스타일이 선택되었습니다.</p>
          <NextStepButton projectId={projectId} currentStepKey="style" deliverableType={deliverableType} />
        </div>
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
            {detailStyle.sampleImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={detailStyle.sampleImageUrl}
                alt={detailStyle.name}
                className="mt-4 aspect-square w-full rounded-md object-cover"
              />
            )}
            <h3 className="mt-4 text-lg font-semibold">{detailStyle.name}</h3>
            <p className="mt-1 text-xs text-neutral-400">{detailStyle.category}</p>
            <p className="mt-3 text-sm">{detailStyle.description}</p>
            <p className="mt-3 text-xs text-neutral-500">{detailStyle.keywords.join(", ")}</p>
          </div>
        </div>
      )}
    </div>
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
      className={`overflow-hidden rounded-md border text-sm ${
        isPrimary
          ? "border-neutral-900 bg-neutral-50"
          : isSecondary
            ? "border-neutral-500 bg-neutral-50"
            : "border-neutral-200"
      }`}
    >
      {style.sampleImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={style.sampleImageUrl}
          alt={style.name}
          className="aspect-square w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="aspect-square w-full bg-neutral-100" aria-hidden />
      )}
      <div className="p-3">
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
    </div>
  );
}
