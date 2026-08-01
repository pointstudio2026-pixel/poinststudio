"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMockupTemplate,
  deleteMockupTemplate,
  fetchAllMockupTemplatesForAdmin,
  generateMockupBackgroundImage,
  type GeneratedMockupBackgroundDto,
  type MockupTemplateDto,
} from "@/services/mockup-templates-admin-service";
import { Spinner } from "@/components/Spinner";

const CATEGORY_LABELS: Record<string, string> = {
  business_card: "명함",
  signboard: "간판",
  mobile_app: "모바일 앱",
  website_hero: "웹사이트",
  brochure: "브로슈어",
  poster: "포스터",
  package: "패키지",
  leaflet: "리플렛",
  banner: "배너",
  uniform: "유니폼",
};
const CATEGORIES = Object.keys(CATEGORY_LABELS);

const SHAPE_LABELS: Record<string, string> = {
  "a circular badge": "원형 배지",
  "a square or rounded-square badge": "사각/둥근사각 배지",
  "a shield/crest shape": "방패/문장 모양",
  "a hexagonal badge": "육각형 배지",
  "an abstract organic blob/leaf-like shape": "유기적 블롭/잎 모양",
  "a diamond/rhombus badge": "다이아몬드 배지",
  "a triangular badge": "삼각형 배지",
  "an abstract asymmetric geometric mark (not a regular polygon)": "비대칭 기하학 마크",
};
const SHAPES = Object.keys(SHAPE_LABELS);

const EMPTY_PLACEMENT = { xPct: 30, yPct: 30, widthPct: 30, heightPct: 30 };

type Stage = "generate" | "edit";

export function MockupTemplatesAdminView() {
  const queryClient = useQueryClient();

  const [stage, setStage] = useState<Stage>("generate");
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [description, setDescription] = useState("");
  const [shape, setShape] = useState(SHAPES[0]!);
  const [containsKoreanText, setContainsKoreanText] = useState(false);
  const [isGeneric, setIsGeneric] = useState(false);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [generated, setGenerated] = useState<GeneratedMockupBackgroundDto | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editKeywords, setEditKeywords] = useState("");
  const [placementArea, setPlacementArea] = useState(EMPTY_PLACEMENT);
  const [useFullDesignArea, setUseFullDesignArea] = useState(false);
  const [fullDesignArea, setFullDesignArea] = useState(EMPTY_PLACEMENT);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  const templatesQuery = useQuery({ queryKey: ["admin-mockup-templates"], queryFn: fetchAllMockupTemplatesForAdmin });

  const generateMutation = useMutation({
    mutationFn: () =>
      generateMockupBackgroundImage({ category, description, shape, containsKoreanText, isGeneric, referenceImage }),
    onSuccess: ({ result }) => {
      setGenerated(result);
      setGenError(null);
    },
    onError: (err) => setGenError(err instanceof Error ? err.message : "생성에 실패했습니다."),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!generated) throw new Error("no generated image");
      return createMockupTemplate({
        category,
        name: editName,
        description: editDescription,
        imageDataUri: generated.imageDataUri,
        placementArea,
        fullDesignPlacementArea: useFullDesignArea ? fullDesignArea : null,
        keywords: editKeywords.split(",").map((k) => k.trim()).filter(Boolean),
        containsKoreanText,
        isGeneric,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-mockup-templates"] });
      resetAll();
    },
    onError: (err) => setCreateError(err instanceof Error ? err.message : "저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMockupTemplate(id),
    onSuccess: ({ mode }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-mockup-templates"] });
      setDeleteNotice(mode === "hidden" ? "실사용 참조가 있어 숨김 처리했습니다." : "완전히 삭제했습니다.");
    },
  });

  function resetAll() {
    setStage("generate");
    setDescription("");
    setReferenceImage(null);
    setGenerated(null);
    setGenError(null);
    setEditName("");
    setEditDescription("");
    setEditKeywords("");
    setPlacementArea(EMPTY_PLACEMENT);
    setUseFullDesignArea(false);
    setFullDesignArea(EMPTY_PLACEMENT);
    setCreateError(null);
  }

  function proceedToEdit() {
    if (!generated) return;
    setEditDescription(description);
    setStage("edit");
  }

  const templates = templatesQuery.data?.templates ?? [];

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-5 sm:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">목업 배경 이미지 관리</h1>
          <p className="mt-1 text-sm text-muted">
            생성 → 확인 즉시 실제 목업 대시보드에 반영됩니다(배포/재시딩 불필요). 자리표시자 마크, 상호명 금지, 단순함
            등 표준 규칙은 자동으로 프롬프트에 덧붙습니다.
          </p>
        </div>
        <Link href="/ops-portal-7x2q" className="text-sm underline">
          관리자 홈으로
        </Link>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-5">
        {stage === "generate" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium">1. 배경 생성</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-muted">
                카테고리
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-lg border border-line px-3 py-2 text-sm text-ink"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                자리표시자 로고 모양
                <select
                  value={shape}
                  onChange={(e) => setShape(e.target.value)}
                  className="rounded-lg border border-line px-3 py-2 text-sm text-ink"
                >
                  {SHAPES.map((s) => (
                    <option key={s} value={s}>
                      {SHAPE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="col-span-2 flex flex-col gap-1 text-xs text-muted">
                설명(무드/스타일/업종 등 자유롭게) — 표준 규칙은 자동으로 덧붙습니다
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="예: 웜톤 미니멀, 베이지·테라코타 톤, 스튜디오 단색 배경"
                  className="rounded-lg border border-line px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                참고 이미지 첨부 (선택)
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => setReferenceImage(e.target.files?.[0] ?? null)}
                  className="text-xs"
                />
              </label>
              <div className="flex flex-col gap-2 text-xs text-muted">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={containsKoreanText}
                    onChange={(e) => setContainsKoreanText(e.target.checked)}
                  />
                  이미지에 한글 텍스트 포함 (한국어 사용자에게만 노출)
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={isGeneric} onChange={(e) => setIsGeneric(e.target.checked)} />
                  특정 업종에 치우치지 않는 무드/스타일 전용 배경 (목업 대시보드 상단 우선 노출)
                </label>
              </div>
            </div>

            {genError && <p className="text-sm text-red-600">{genError}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending || !description.trim()}
                className="flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-sm text-paper transition hover:opacity-90 disabled:opacity-50"
              >
                {generateMutation.isPending && <Spinner />}
                {generated ? "다시 생성" : "생성"}
              </button>
              {generated && (
                <button
                  type="button"
                  onClick={proceedToEdit}
                  className="rounded-full border border-line px-5 py-2 text-sm transition hover:border-ink"
                >
                  이 결과로 계속 →
                </button>
              )}
            </div>

            {generated && (
              <div className="mt-2 max-w-sm overflow-hidden rounded-xl border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={generated.imageDataUri} alt="생성된 목업 배경" className="w-full" />
              </div>
            )}
          </div>
        )}

        {stage === "edit" && generated && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">2. 정보 입력 후 확인</h2>
              <button type="button" onClick={() => setStage("generate")} className="text-xs underline">
                ← 배경 다시 고르기
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[240px_1fr]">
              <div className="overflow-hidden rounded-xl border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={generated.imageDataUri} alt="생성된 목업 배경" className="w-full" />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs text-muted">
                  이름 (관리자 검색용, 사용자에게 노출 안 됨)
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="예: 웜톤 미니멀 명함 배경"
                    className="rounded-lg border border-line px-3 py-2 text-sm text-ink"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-muted">
                  카테고리
                  <input
                    type="text"
                    value={CATEGORY_LABELS[category]}
                    disabled
                    className="rounded-lg border border-line bg-paper-dark px-3 py-2 text-sm text-muted"
                  />
                </label>
                <label className="col-span-2 flex flex-col gap-1 text-xs text-muted">
                  설명
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className="rounded-lg border border-line px-3 py-2 text-sm text-ink"
                  />
                </label>
                <label className="col-span-2 flex flex-col gap-1 text-xs text-muted">
                  검색 키워드 (쉼표로 구분, 여러 언어 섞어서 가능)
                  <input
                    type="text"
                    value={editKeywords}
                    onChange={(e) => setEditKeywords(e.target.value)}
                    placeholder="명함, 웜톤, business card, warm minimal"
                    className="rounded-lg border border-line px-3 py-2 text-sm text-ink"
                  />
                </label>

                <fieldset className="col-span-2 grid grid-cols-4 gap-2 text-xs text-muted">
                  <legend className="mb-1 text-xs text-muted">로고 배치 영역 (%)</legend>
                  {(["xPct", "yPct", "widthPct", "heightPct"] as const).map((key) => (
                    <label key={key} className="flex flex-col gap-1">
                      {key}
                      <input
                        type="number"
                        value={placementArea[key]}
                        onChange={(e) => setPlacementArea({ ...placementArea, [key]: Number(e.target.value) })}
                        className="rounded-lg border border-line px-2 py-1 text-sm text-ink"
                      />
                    </label>
                  ))}
                </fieldset>

                <label className="col-span-2 flex items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={useFullDesignArea}
                    onChange={(e) => setUseFullDesignArea(e.target.checked)}
                  />
                  완성된 디자인 시안을 통째로 배치하는 영역도 별도 설정
                </label>
                {useFullDesignArea && (
                  <fieldset className="col-span-2 grid grid-cols-4 gap-2 text-xs text-muted">
                    {(["xPct", "yPct", "widthPct", "heightPct"] as const).map((key) => (
                      <label key={key} className="flex flex-col gap-1">
                        {key}
                        <input
                          type="number"
                          value={fullDesignArea[key]}
                          onChange={(e) => setFullDesignArea({ ...fullDesignArea, [key]: Number(e.target.value) })}
                          className="rounded-lg border border-line px-2 py-1 text-sm text-ink"
                        />
                      </label>
                    ))}
                  </fieldset>
                )}
              </div>
            </div>

            {createError && <p className="text-sm text-red-600">{createError}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !editName.trim() || !editDescription.trim()}
                className="flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-sm text-paper transition hover:opacity-90 disabled:opacity-50"
              >
                {createMutation.isPending && <Spinner />}
                확인 (즉시 반영)
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="rounded-full border border-line px-5 py-2 text-sm transition hover:border-ink"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">
            전체 템플릿 ({templates.length}개, 숨김 {templates.filter((t) => t.hidden).length}개)
          </h2>
          {deleteNotice && <p className="text-xs text-muted">{deleteNotice}</p>}
        </div>

        {templatesQuery.isLoading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {!templatesQuery.isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {templates.map((t: MockupTemplateDto) => (
              <div key={t.id} className="flex flex-col overflow-hidden rounded-xl border border-line">
                <div className="aspect-square overflow-hidden bg-paper-dark">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.backgroundUrl} alt={t.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col gap-1 p-2 text-xs">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-muted">{CATEGORY_LABELS[t.category] ?? t.category}</span>
                  <div className="flex flex-wrap gap-1">
                    {t.hidden && <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">숨김</span>}
                    {t.isGeneric && <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">범용</span>}
                    {t.containsKoreanText && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">한글</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`"${t.name}"을(를) 삭제할까요? (실사용 참조가 있으면 자동으로 숨김 처리됩니다)`)) {
                        deleteMutation.mutate(t.id);
                      }
                    }}
                    className="mt-auto text-left text-xs text-red-600 underline"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <p className="col-span-full py-6 text-center text-sm text-muted">템플릿이 없습니다.</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
