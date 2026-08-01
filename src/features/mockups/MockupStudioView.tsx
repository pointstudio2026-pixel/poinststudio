"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMockup,
  deleteMockup,
  fetchMockups,
  fetchMockupTemplates,
  recommendMockupCategories,
  toggleMockupFavorite,
  MOCKUP_CATEGORY_LABELS,
  type MockupCategoryDto,
  type MockupProjectDto,
} from "@/services/mockups-service";
import { fetchGenerationHistory } from "@/services/generations-service";
import { Spinner } from "@/components/Spinner";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import { DELIVERABLE_TYPE_TO_MOCKUP_CATEGORY } from "@/modules/mockups/domain/mockupRules";
import { isBrandingDeliverableType } from "@/modules/projects/domain/deliverableTypes";
import { MOCKUP_CATEGORY_LABEL_KEYS } from "@/features/mockups/mockupCategoryLabels";

const ALL_CATEGORIES = Object.keys(MOCKUP_CATEGORY_LABELS) as MockupCategoryDto[];

export function MockupStudioView({
  projectId,
  deliverableType,
}: {
  projectId: string;
  deliverableType: string | null;
}) {
  const { t, locale } = useTranslation();
  // "완성된 결과물"(포스터/브로슈어 등) deliverableType은 대응하는 목업
  // 카테고리 하나로 고정한다 -- 명함 프로젝트에 웹사이트 목업이 뜰 이유가
  // 없다. 매핑이 없으면(브랜딩 & 로고, 레거시 null) 기존 그대로 전체
  // 카테고리를 다 보여준다.
  const lockedCategory = deliverableType ? DELIVERABLE_TYPE_TO_MOCKUP_CATEGORY[deliverableType] : undefined;
  const queryClient = useQueryClient();
  const [previewMockup, setPreviewMockup] = useState<MockupProjectDto | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MockupCategoryDto | null>(null);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: mockupsData } = useQuery({
    queryKey: ["mockups", projectId],
    queryFn: () => fetchMockups(projectId),
    refetchInterval: (query) => {
      const hasInFlight = query.state.data?.mockups.some(
        (m) => m.status === "pending" || m.status === "processing",
      );
      return hasInFlight ? 1500 : false;
    },
  });

  const { data: historyData } = useQuery({
    queryKey: ["generation-history", projectId],
    queryFn: () => fetchGenerationHistory(projectId),
  });
  const completedVersions = (historyData?.versions ?? [])
    .filter((v) => v.status === "completed")
    .sort((a, b) => a.versionNumber - b.versionNumber);
  const sourceVersionId = selectedVersionId ?? completedVersions[completedVersions.length - 1]?.id ?? null;

  const { data: recommendData } = useQuery({
    queryKey: ["mockup-category-recommendations", projectId],
    queryFn: () => recommendMockupCategories(projectId),
    enabled: completedVersions.length > 0 && !lockedCategory,
  });
  const orderedCategories = recommendData?.recommendations.map((r) => r.category) ?? ALL_CATEGORIES;
  const activeCategory = lockedCategory ?? selectedCategory ?? orderedCategories[0] ?? null;

  // 2026-08-01 사용자 결정: batch-3로 카테고리당 템플릿이 40개 넘게
  // 늘어나면서, 아래에서 예시 이미지를 그리드로 죽 나열하던 화면이 지저분해
  // 졌다 -- 그런데 그 그리드는 어차피 둘러보기용일 뿐 클릭해도 실제 생성엔
  // 전혀 영향이 없었다(항상 templates[0]만 사용, handleCreateMockup 참고).
  // 그래서 예시 그리드 자체를 없애고 이 쿼리는 카테고리에 템플릿이 있는지
  // (버튼 활성화 여부)와 templates[0] id를 얻는 용도로만 남긴다. 목업
  // 대시보드(/mockups/new, ops-portal 관리 화면)는 실제 배경을 고르는
  // 화면이라 여기 해당 안 되고 그대로 둔다.
  const { data: templatesData } = useQuery({
    queryKey: ["mockup-templates", activeCategory, locale],
    queryFn: () => fetchMockupTemplates(activeCategory ?? undefined, locale),
    enabled: Boolean(activeCategory),
  });

  async function handleFavorite(mockup: MockupProjectDto) {
    await toggleMockupFavorite(mockup.id, !mockup.isFavorite);
    await queryClient.invalidateQueries({ queryKey: ["mockups", projectId] });
  }

  async function handleDelete(mockupId: string) {
    await deleteMockup(mockupId);
    await queryClient.invalidateQueries({ queryKey: ["mockups", projectId] });
  }

  async function handleCreateMockup(templateId: string) {
    if (!sourceVersionId) return;
    setCreatingTemplateId(templateId);
    setCreateError(null);
    try {
      await createMockup(projectId, sourceVersionId, 0, templateId);
      await queryClient.invalidateQueries({ queryKey: ["mockups", projectId] });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t("mockupStudio.createFailed"));
    } finally {
      setCreatingTemplateId(null);
    }
  }

  // 2026-07-25 사용자 결정: 브랜딩 & 로고를 제외한 작업물 유형은 목업
  // 스튜디오 자체가 필요 없다(생성 자체가 이미 목업 사진 형태로 나옴).
  // 워크스페이스 단계 목록/사이드바에서는 이미 숨겨지지만, 직접 URL로
  // 들어오는 경우를 대비해 여기서도 명시적으로 막는다.
  if (!isBrandingDeliverableType(deliverableType)) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted shadow-soft">
        {t("mockupStudio.notNeeded")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold">{t("mockupStudio.title")}</h1>
      </header>

      {/* 결과물(목업 갤러리)을 카테고리 선택 영역보다 먼저 보여준다 -- 방금
          생성한 결과를 보려고 매번 스크롤을 크게 내려야 했다. */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-ink">{t("mockupStudio.gallery")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(mockupsData?.mockups ?? []).map((mockup) => (
            <div key={mockup.id} className="flex flex-col gap-1 rounded-xl border border-line p-2">
              {mockup.status === "completed" && mockup.resultImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mockup.thumbnailUrl ?? mockup.resultImageUrl}
                  alt="Mockup"
                  onClick={() => setPreviewMockup(mockup)}
                  className="aspect-square w-full cursor-pointer rounded-xl object-cover"
                />
              ) : mockup.status === "failed" ? (
                <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-red-50 text-xs text-red-600">
                  {t("mockupStudio.failed", { message: mockup.errorMessage ?? "" })}
                </div>
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-line">
                  <Spinner />
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-muted">
                <button type="button" onClick={() => handleFavorite(mockup)} aria-label={t("mockupStudio.favorite")}>
                  {mockup.isFavorite ? "★" : "☆"}
                </button>
                <button type="button" onClick={() => handleDelete(mockup.id)} className="underline">
                  {t("mockupStudio.delete")}
                </button>
              </div>
            </div>
          ))}
          {mockupsData?.mockups.length === 0 && (
            <p className="col-span-2 text-sm text-muted sm:col-span-3">{t("mockupStudio.noMockupsYet")}</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <h2 className="text-sm font-medium text-ink">{t("mockupStudio.newMockup")}</h2>

        {completedVersions.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
            {t("mockupStudio.generateFirst")}
            <div className="mt-3">
              <Link
                href={`/projects/${projectId}/generation`}
                className="rounded-full bg-ink px-4 py-2 text-sm text-paper"
              >
                {t("mockupStudio.goGenerate")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {completedVersions.length > 1 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted">{t("mockupStudio.sourceImage")}</p>
                <div className="flex flex-wrap gap-2">
                  {completedVersions.map((version, i) => (
                    <button
                      key={version.id}
                      type="button"
                      onClick={() => setSelectedVersionId(version.id)}
                      className={`shrink-0 overflow-hidden rounded-xl border-2 ${
                        sourceVersionId === version.id ? "border-ink" : "border-transparent"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={version.images[0]?.url}
                        alt={t("mockupStudio.resultAlt", { n: String(i + 1) })}
                        className="h-16 w-16 object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!lockedCategory && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted">{t("mockupStudio.category")}</p>
                <div className="flex flex-wrap gap-2">
                  {orderedCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${
                        activeCategory === category
                          ? "border-ink bg-ink text-paper"
                          : "border-line hover:border-ink"
                      }`}
                    >
                      {t(MOCKUP_CATEGORY_LABEL_KEYS[category])}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {createError && <p className="text-sm text-red-600">{createError}</p>}

            {activeCategory && (
              <button
                type="button"
                onClick={() => {
                  const primaryTemplateId = templatesData?.templates[0]?.id;
                  if (primaryTemplateId) handleCreateMockup(primaryTemplateId);
                }}
                disabled={Boolean(creatingTemplateId) || !templatesData?.templates.length}
                className="flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-50"
              >
                {creatingTemplateId && <Spinner />}
                {t(MOCKUP_CATEGORY_LABEL_KEYS[activeCategory])} {t("mockupStudio.select")}
              </button>
            )}
          </div>
        )}
      </section>

      {previewMockup?.resultImageUrl && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 p-8"
          onClick={() => setPreviewMockup(null)}
        >
          <div className="flex max-w-lg flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewMockup.resultImageUrl} alt="Mockup preview" className="max-h-[70vh] rounded-2xl" />
            <div className="flex gap-2">
              <a
                href={previewMockup.resultImageUrl}
                download={`mockup-${previewMockup.id}.svg`}
                className="rounded-full bg-ink px-4 py-2 text-sm text-paper"
              >
                {t("mockupStudio.download")}
              </a>
              <button
                type="button"
                onClick={() => setPreviewMockup(null)}
                className="rounded-full border border-line px-4 py-2 text-sm"
              >
                {t("mockupStudio.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
