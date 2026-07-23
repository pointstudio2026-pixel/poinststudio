"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTrainingExample,
  deleteTrainingExample,
  fetchTrainingExamples,
} from "@/services/admin-service";
import { DELIVERABLE_TYPE_OPTIONS } from "@/modules/projects/domain/deliverableTypes";
import { Spinner } from "@/components/Spinner";

export function TrainingExamplesView() {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [deliverableType, setDeliverableType] = useState(DELIVERABLE_TYPE_OPTIONS[0]!);
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-training-examples"],
    queryFn: fetchTrainingExamples,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!image) {
      setFormError("이미지 파일을 선택해주세요.");
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    try {
      await createTrainingExample({ prompt, deliverableType, image });
      setPrompt("");
      setImage(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-training-examples"] });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteTrainingExample(id);
    await queryClient.invalidateQueries({ queryKey: ["admin-training-examples"] });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">작업물 스타일 학습 자료</h1>
          <p className="mt-1 text-sm text-neutral-500">
            프롬프트와 그 프롬프트로 만든 생성 이미지를 등록하면, 같은 작업물 유형의 실제 프로젝트 프롬프트를
            만들 때 참고 자료로 자동 반영됩니다. (AI 분석 없이 텍스트 매칭만 사용 -- 비용 없음)
          </p>
        </div>
        <Link href="/ops-portal-7x2q" className="text-sm underline">
          대시보드로
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="deliverableType" className="text-sm text-neutral-500">
            작업물 유형
          </label>
          <select
            id="deliverableType"
            value={deliverableType}
            onChange={(e) => setDeliverableType(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {DELIVERABLE_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="prompt" className="text-sm text-neutral-500">
            프롬프트
          </label>
          <textarea
            id="prompt"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="image" className="text-sm text-neutral-500">
            생성 이미지 (PNG/JPEG, 5MB 이하)
          </label>
          <input
            id="image"
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-fit items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting && <Spinner />}
          {isSubmitting ? "등록 중..." : "등록"}
        </button>
      </form>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading && (
          <div className="col-span-full flex justify-center p-6">
            <Spinner />
          </div>
        )}
        {!isLoading && data?.examples.length === 0 && (
          <p className="col-span-full text-center text-sm text-neutral-400">아직 등록된 학습 자료가 없습니다.</p>
        )}
        {data?.examples.map((example) => (
          <div key={example.id} className="flex flex-col gap-2 rounded-md border border-neutral-200 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/admin/training-examples/${example.id}/image`}
              alt={example.prompt}
              className="aspect-square w-full rounded-md object-cover"
            />
            <span className="w-fit rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
              {example.deliverableType}
            </span>
            <p className="line-clamp-3 text-xs text-neutral-600">{example.prompt}</p>
            <button
              type="button"
              onClick={() => handleDelete(example.id)}
              className="text-left text-xs text-red-600 underline"
            >
              삭제
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
