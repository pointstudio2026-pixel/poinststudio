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

const ALL_CATEGORIES = Object.keys(MOCKUP_CATEGORY_LABELS) as MockupCategoryDto[];

export function MockupStudioView({ projectId }: { projectId: string }) {
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
    enabled: completedVersions.length > 0,
  });
  const orderedCategories = recommendData?.recommendations.map((r) => r.category) ?? ALL_CATEGORIES;
  const activeCategory = selectedCategory ?? orderedCategories[0] ?? null;

  const { data: templatesData } = useQuery({
    queryKey: ["mockup-templates", activeCategory],
    queryFn: () => fetchMockupTemplates(activeCategory ?? undefined),
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
      setCreateError(err instanceof Error ? err.message : "목업 생성에 실패했습니다.");
    } finally {
      setCreatingTemplateId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold">목업 스튜디오</h1>
      </header>

      {/* 결과물(목업 갤러리)을 카테고리 선택 영역보다 먼저 보여준다 -- 방금
          생성한 결과를 보려고 매번 스크롤을 크게 내려야 했다. */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-neutral-700">목업 갤러리</h2>
        <div className="grid grid-cols-3 gap-3">
          {(mockupsData?.mockups ?? []).map((mockup) => (
            <div key={mockup.id} className="flex flex-col gap-1 rounded-md border border-neutral-200 p-2">
              {mockup.status === "completed" && mockup.resultImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mockup.thumbnailUrl ?? mockup.resultImageUrl}
                  alt="Mockup"
                  onClick={() => setPreviewMockup(mockup)}
                  className="aspect-square w-full cursor-pointer rounded-md object-cover"
                />
              ) : mockup.status === "failed" ? (
                <div className="flex aspect-square w-full items-center justify-center rounded-md bg-red-50 text-xs text-red-600">
                  실패: {mockup.errorMessage}
                </div>
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-md bg-neutral-100">
                  <Spinner />
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <button type="button" onClick={() => handleFavorite(mockup)} aria-label="즐겨찾기">
                  {mockup.isFavorite ? "★" : "☆"}
                </button>
                <button type="button" onClick={() => handleDelete(mockup.id)} className="underline">
                  삭제
                </button>
              </div>
            </div>
          ))}
          {mockupsData?.mockups.length === 0 && (
            <p className="col-span-3 text-sm text-neutral-400">아직 생성된 목업이 없습니다.</p>
          )}
        </div>
      </section>

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">새 목업 만들기</h2>

        {completedVersions.length === 0 ? (
          <div className="mt-3 rounded-md border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400">
            먼저 이미지 생성을 완료해야 목업을 만들 수 있습니다.
            <div className="mt-3">
              <Link
                href={`/projects/${projectId}/generation`}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white"
              >
                이미지 생성하러 가기
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {completedVersions.length > 1 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-neutral-500">사용할 결과 이미지</p>
                <div className="flex gap-2">
                  {completedVersions.map((version, i) => (
                    <button
                      key={version.id}
                      type="button"
                      onClick={() => setSelectedVersionId(version.id)}
                      className={`overflow-hidden rounded-md border-2 ${
                        sourceVersionId === version.id ? "border-neutral-900" : "border-transparent"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={version.images[0]?.url} alt={`결과 ${i + 1}`} className="h-16 w-16 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-1.5 text-xs font-medium text-neutral-500">카테고리</p>
              <div className="flex flex-wrap gap-2">
                {orderedCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      activeCategory === category
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300 hover:border-neutral-900"
                    }`}
                  >
                    {MOCKUP_CATEGORY_LABELS[category]}
                  </button>
                ))}
              </div>
            </div>

            {createError && <p className="text-sm text-red-600">{createError}</p>}

            <div className="grid grid-cols-3 gap-3">
              {(templatesData?.templates ?? []).map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleCreateMockup(template.id)}
                  disabled={Boolean(creatingTemplateId)}
                  className="group relative overflow-hidden rounded-md border border-neutral-200 text-left transition hover:border-neutral-900 disabled:opacity-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={template.backgroundUrl}
                    alt={template.name}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1 text-xs text-white">
                    {template.name}
                  </div>
                  {creatingTemplateId === template.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Spinner />
                    </div>
                  )}
                </button>
              ))}
            </div>
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
            <img src={previewMockup.resultImageUrl} alt="Mockup preview" className="max-h-[70vh] rounded-md" />
            <div className="flex gap-2">
              <a
                href={previewMockup.resultImageUrl}
                download={`mockup-${previewMockup.id}.svg`}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white"
              >
                다운로드
              </a>
              <button
                type="button"
                onClick={() => setPreviewMockup(null)}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
