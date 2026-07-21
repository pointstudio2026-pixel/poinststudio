"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteMockup, fetchMockups, toggleMockupFavorite, type MockupProjectDto } from "@/services/mockups-service";
import { Spinner } from "@/components/Spinner";

export function MockupStudioView({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [previewMockup, setPreviewMockup] = useState<MockupProjectDto | null>(null);

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

  async function handleFavorite(mockup: MockupProjectDto) {
    await toggleMockupFavorite(mockup.id, !mockup.isFavorite);
    await queryClient.invalidateQueries({ queryKey: ["mockups", projectId] });
  }

  async function handleDelete(mockupId: string) {
    await deleteMockup(mockupId);
    await queryClient.invalidateQueries({ queryKey: ["mockups", projectId] });
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
        <p className="mt-2 text-sm text-neutral-400">서비스 예정입니다.</p>
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
