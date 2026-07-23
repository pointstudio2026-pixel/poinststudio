"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addUserStyleReferenceImage,
  createUserStyleCategory,
  deleteUserStyleCategory,
  fetchUserStyleCategories,
  reanalyzeUserStyleCategory,
  userStyleReferenceImageUrl,
  type UserStyleCategoryDto,
} from "@/services/user-styles-service";
import { MAX_REFERENCES_PER_CATEGORY } from "@/modules/userStyles/domain/userStyleRules";
import { Spinner } from "@/components/Spinner";
import { AppHeader } from "@/features/navigation/AppHeader";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

export function MyStylesView({
  email,
  name,
  planCode,
}: {
  email: string;
  name: string | null;
  planCode: PlanCode;
}) {
  const queryClient = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyCategoryId, setBusyCategoryId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["user-style-categories"],
    queryFn: fetchUserStyleCategories,
  });

  const categories = data?.categories ?? [];

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["user-style-categories"] });
  }

  async function handleCreate() {
    const name = newCategoryName.trim();
    if (!name) return;
    setIsCreating(true);
    setError(null);
    try {
      await createUserStyleCategory(name);
      setNewCategoryName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "카테고리 생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpload(category: UserStyleCategoryDto, file: File) {
    setBusyCategoryId(category.id);
    setError(null);
    try {
      await addUserStyleReferenceImage(category.id, file);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.");
    } finally {
      setBusyCategoryId(null);
    }
  }

  async function handleReanalyze(categoryId: string) {
    setBusyCategoryId(categoryId);
    setError(null);
    try {
      await reanalyzeUserStyleCategory(categoryId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "재분석에 실패했습니다.");
    } finally {
      setBusyCategoryId(null);
    }
  }

  async function handleDelete(categoryId: string) {
    const confirmed = window.confirm("이 스타일 카테고리를 삭제하시겠습니까? 등록된 참고 이미지도 함께 삭제됩니다.");
    if (!confirmed) return;
    setBusyCategoryId(categoryId);
    setError(null);
    try {
      await deleteUserStyleCategory(categoryId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setBusyCategoryId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper">
        <AppHeader user={{ email, name }} planCode={planCode} />
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader user={{ email, name }} planCode={planCode} />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <header>
        <h1 className="text-xl font-semibold">내 스타일</h1>
        <p className="mt-1 text-sm text-neutral-500">
          직접 참고 이미지를 등록하면, 이미지 생성 전 프로젝트의 스타일 단계에서 내 스타일로
          선택할 수 있습니다. 계정 전체에서 재사용됩니다.
        </p>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">새 카테고리 만들기</h2>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="예: 우리 브랜드 로고 스타일"
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || !newCategoryName.trim()}
            className="flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {isCreating && <Spinner />}
            만들기
          </button>
        </div>
      </section>

      {categories.length === 0 ? (
        <div className="rounded-md border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400">
          아직 등록한 스타일이 없습니다. 위에서 카테고리를 만들고 참고 이미지를 추가해보세요.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {categories.map((category) => {
            const isBusy = busyCategoryId === category.id;
            return (
              <div key={category.id} className="rounded-md border border-neutral-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">{category.name}</h3>
                    <p className="mt-1 text-xs text-neutral-500">
                      {category.description ?? "아직 스타일 분석 결과가 없습니다. 이미지를 추가하면 자동으로 분석됩니다."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(category.id)}
                    disabled={isBusy}
                    className="shrink-0 text-xs text-red-600 underline disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {category.references.map((ref) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={ref.id}
                      src={userStyleReferenceImageUrl(ref.id)}
                      alt=""
                      className="h-20 w-20 rounded-md border border-neutral-200 object-cover"
                    />
                  ))}
                  {category.references.length < MAX_REFERENCES_PER_CATEGORY && (
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[category.id]?.click()}
                      disabled={isBusy}
                      className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-neutral-300 text-xs text-neutral-400 disabled:opacity-50"
                    >
                      {isBusy ? <Spinner /> : "+ 추가"}
                    </button>
                  )}
                  <input
                    ref={(el) => {
                      fileInputRefs.current[category.id] = el;
                    }}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleUpload(category, file);
                      e.target.value = "";
                    }}
                  />
                </div>

                {category.references.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleReanalyze(category.id)}
                    disabled={isBusy}
                    className="mt-3 text-xs text-neutral-500 underline disabled:opacity-50"
                  >
                    다시 분석
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      </main>
    </div>
  );
}
