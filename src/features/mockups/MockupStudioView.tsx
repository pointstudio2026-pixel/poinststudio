"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchGenerationHistory } from "@/services/generations-service";
import {
  MOCKUP_CATEGORY_LABELS,
  createMockup,
  deleteMockup,
  fetchMockupTemplates,
  fetchMockups,
  toggleMockupFavorite,
  type MockupCategoryDto,
  type MockupProjectDto,
} from "@/services/mockups-service";
import { Spinner } from "@/components/Spinner";

export function MockupStudioView({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<MockupCategoryDto | "">("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [previewMockup, setPreviewMockup] = useState<MockupProjectDto | null>(null);

  const { data: generationData } = useQuery({
    queryKey: ["generation-history", projectId],
    queryFn: () => fetchGenerationHistory(projectId),
    retry: false,
  });
  const sourceImages = generationData?.generation.currentVersion.images ?? [];

  const { data: templatesData } = useQuery({
    queryKey: ["mockup-templates", categoryFilter],
    queryFn: () => fetchMockupTemplates(categoryFilter || undefined),
  });

  const { data: mockupsData } = useQuery({
    queryKey: ["mockups", projectId, categoryFilter],
    queryFn: () => fetchMockups(projectId, categoryFilter || undefined),
    refetchInterval: (query) => {
      const hasInFlight = query.state.data?.mockups.some(
        (m) => m.status === "pending" || m.status === "processing",
      );
      return hasInFlight ? 1500 : false;
    },
  });

  async function handleRender() {
    if (!selectedTemplateId || sourceImages.length === 0) return;
    setIsRendering(true);
    setActionError(null);
    try {
      await createMockup(projectId, generationData!.generation.currentVersion.id, selectedImageIndex, selectedTemplateId);
      await queryClient.invalidateQueries({ queryKey: ["mockups", projectId] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "목업 생성에 실패했습니다.");
    } finally {
      setIsRendering(false);
    }
  }

  async function handleFavorite(mockup: MockupProjectDto) {
    await toggleMockupFavorite(mockup.id, !mockup.isFavorite);
    await queryClient.invalidateQueries({ queryKey: ["mockups", projectId] });
  }

  async function handleDelete(mockupId: string) {
    await deleteMockup(mockupId);
    await queryClient.invalidateQueries({ queryKey: ["mockups", projectId] });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mockup Studio</h1>
        <Link href={`/projects/${projectId}`} className="text-sm underline">
          프로젝트로
        </Link>
      </header>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">새 목업 만들기</h2>
        {sourceImages.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-400">
            먼저 Generation 단계에서 로고 컨셉 이미지를 생성해야 목업을 만들 수 있습니다.
          </p>
        ) : (
          <>
            <div className="mt-2 flex gap-2">
              {sourceImages.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img.thumbnailUrl}
                  alt={`Logo ${i + 1}`}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`h-16 w-16 cursor-pointer rounded-md border object-cover ${
                    selectedImageIndex === i ? "border-neutral-900 ring-2 ring-neutral-900" : "border-neutral-200"
                  }`}
                />
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as MockupCategoryDto | "")}
                className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
              >
                <option value="">전체 카테고리</option>
                {Object.entries(MOCKUP_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {(templatesData?.templates ?? []).map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`flex flex-col items-center gap-1 rounded-md border p-2 ${
                    selectedTemplateId === template.id ? "border-neutral-900 ring-2 ring-neutral-900" : "border-neutral-200"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={template.backgroundUrl} alt={template.name} className="aspect-square w-full rounded-sm object-cover" />
                  <span className="text-[10px] text-neutral-500">{template.name}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleRender}
              disabled={!selectedTemplateId || isRendering}
              className="mt-4 flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {isRendering && <Spinner />}
              목업 생성
            </button>
          </>
        )}
      </section>

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
    </main>
  );
}
