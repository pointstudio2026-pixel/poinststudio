"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTrainingExample,
  deleteTrainingExample,
  fetchTrainingExamples,
  promoteGenerationsToReference,
} from "@/services/admin-service";
import { DELIVERABLE_TYPE_OPTIONS } from "@/modules/projects/domain/deliverableTypes";
import { INDUSTRY_OPTIONS } from "@/modules/interviews/domain/interviewQuestions";
import { KNOWN_TRAINING_EXAMPLE_CATEGORIES } from "@/modules/trainingExamples/domain/TrainingExample";
import { Spinner } from "@/components/Spinner";

const CUSTOM_CATEGORY_OPTION = "직접 입력";
const ALL_OPTION = "전체";
const UNSET_INDUSTRY_OPTION = "업종 미지정";

type EvaluationFilter = "전체" | "참고자료(60점 이상)" | "회피대상(60점 미만)" | "미평가";
const EVALUATION_FILTERS: EvaluationFilter[] = ["전체", "참고자료(60점 이상)", "회피대상(60점 미만)", "미평가"];

export function TrainingExamplesView() {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [deliverableType, setDeliverableType] = useState(DELIVERABLE_TYPE_OPTIONS[0]!);
  const [category, setCategory] = useState<string>(KNOWN_TRAINING_EXAMPLE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [industry, setIndustry] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteResult, setPromoteResult] = useState<{ evaluated: number; promoted: number } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_OPTION);
  const [deliverableTypeFilter, setDeliverableTypeFilter] = useState<string>(ALL_OPTION);
  const [industryFilter, setIndustryFilter] = useState<string>(ALL_OPTION);
  const [evaluationFilter, setEvaluationFilter] = useState<EvaluationFilter>("전체");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-training-examples"],
    queryFn: fetchTrainingExamples,
  });

  const categoryTabs = [
    ALL_OPTION,
    ...Array.from(new Set([...KNOWN_TRAINING_EXAMPLE_CATEGORIES, ...(data?.examples.map((e) => e.category) ?? [])])),
  ];
  const deliverableTypeTabs = [
    ALL_OPTION,
    ...Array.from(new Set(data?.examples.map((e) => e.deliverableType) ?? [])),
  ];
  const industryTabs = [
    ALL_OPTION,
    UNSET_INDUSTRY_OPTION,
    ...Array.from(new Set((data?.examples ?? []).map((e) => e.industry).filter((v): v is string => Boolean(v)))),
  ];

  const visibleExamples = (data?.examples ?? []).filter((e) => {
    if (categoryFilter !== ALL_OPTION && e.category !== categoryFilter) return false;
    if (deliverableTypeFilter !== ALL_OPTION && e.deliverableType !== deliverableTypeFilter) return false;
    if (industryFilter === UNSET_INDUSTRY_OPTION && e.industry) return false;
    if (industryFilter !== ALL_OPTION && industryFilter !== UNSET_INDUSTRY_OPTION && e.industry !== industryFilter) return false;
    if (evaluationFilter === "참고자료(60점 이상)" && !(e.evaluationScore !== null && e.evaluationScore >= 0.6)) return false;
    if (evaluationFilter === "회피대상(60점 미만)" && !(e.evaluationScore !== null && e.evaluationScore < 0.6)) return false;
    if (evaluationFilter === "미평가" && e.evaluationScore !== null) return false;
    return true;
  });

  async function handlePromote() {
    setIsPromoting(true);
    setPromoteResult(null);
    try {
      const { result } = await promoteGenerationsToReference();
      setPromoteResult(result);
      await queryClient.invalidateQueries({ queryKey: ["admin-training-examples"] });
    } finally {
      setIsPromoting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!image) {
      setFormError("이미지 파일을 선택해주세요.");
      return;
    }
    const resolvedCategory = category === CUSTOM_CATEGORY_OPTION ? customCategory.trim() : category;
    if (!resolvedCategory) {
      setFormError("카테고리를 입력해주세요.");
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    try {
      await createTrainingExample({
        prompt,
        deliverableType,
        image,
        category: resolvedCategory,
        industry: industry || undefined,
      });
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
            &quot;이미지생성&quot; 카테고리는 이미지 생성 파이프라인에만, &quot;목업&quot; 카테고리는 목업 생성
            파이프라인에만 영향을 주며 서로 절대 섞이지 않습니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/ops-portal-7x2q/prompt-decisions" className="text-sm underline">
            프롬프트 우선순위 기록
          </Link>
          <Link href="/ops-portal-7x2q" className="text-sm underline">
            대시보드로
          </Link>
        </div>
      </header>

      <div className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <button
          type="button"
          onClick={handlePromote}
          disabled={isPromoting}
          className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {isPromoting && <Spinner />}
          지금 바로 실행
        </button>
        <p className="text-xs text-neutral-500">
          {promoteResult
            ? `${promoteResult.evaluated}건 평가, ${promoteResult.promoted}건 DB 반영(60점 이상)`
            : "매일 자동으로도 실행됩니다. 실사용자 생성물 중 아직 평가 안 된 것들을 비용 없는 행동 신호(재시도/내보내기/프로젝트 완료 여부)와 사용자 평가로 채점하고 60점 이상만 참고자료로 반영합니다."}
        </p>
      </div>

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

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="category" className="text-sm text-neutral-500">
              카테고리
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              {KNOWN_TRAINING_EXAMPLE_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value={CUSTOM_CATEGORY_OPTION}>{CUSTOM_CATEGORY_OPTION}</option>
            </select>
            {category === CUSTOM_CATEGORY_OPTION && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="새 카테고리 이름"
                className="mt-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            )}
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="industry" className="text-sm text-neutral-500">
              업종 (선택 사항)
            </label>
            <select
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">선택 안 함</option>
              {INDUSTRY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
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

      <div className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
        <div>
          <p className="mb-1 text-xs font-medium text-neutral-500">카테고리</p>
          <div className="flex flex-wrap gap-2">
            {categoryTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setCategoryFilter(tab)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  categoryFilter === tab
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white text-neutral-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-deliverableType" className="text-xs font-medium text-neutral-500">
              작업물 유형
            </label>
            <select
              id="filter-deliverableType"
              value={deliverableTypeFilter}
              onChange={(e) => setDeliverableTypeFilter(e.target.value)}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            >
              {deliverableTypeTabs.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filter-industry" className="text-xs font-medium text-neutral-500">
              업종
            </label>
            <select
              id="filter-industry"
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            >
              {industryTabs.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filter-evaluation" className="text-xs font-medium text-neutral-500">
              평가 상태
            </label>
            <select
              id="filter-evaluation"
              value={evaluationFilter}
              onChange={(e) => setEvaluationFilter(e.target.value as EvaluationFilter)}
              className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            >
              {EVALUATION_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-neutral-400">{visibleExamples.length}건 표시 중 (전체 {data?.examples.length ?? 0}건)</p>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {isLoading && (
          <div className="col-span-full flex justify-center p-6">
            <Spinner />
          </div>
        )}
        {!isLoading && visibleExamples.length === 0 && (
          <p className="col-span-full text-center text-sm text-neutral-400">조건에 맞는 학습 자료가 없습니다.</p>
        )}
        {visibleExamples.map((example) => (
          <div key={example.id} className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3">
            {example.imageStorageKey && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/admin/training-examples/${example.id}/image`}
                alt={example.prompt}
                className="aspect-square w-full rounded-md object-cover"
              />
            )}
            <div className="flex flex-wrap gap-1">
              <span className="w-fit rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-white">
                {example.category}
              </span>
              <span className="w-fit rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                {example.deliverableType}
              </span>
              <span className="w-fit rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                {example.industry ?? UNSET_INDUSTRY_OPTION}
              </span>
              <span className="w-fit rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                {example.source === "ADMIN" ? "관리자 입력" : example.source === "USER_GENERATION" ? "사용자 생성물" : "리서치"}
              </span>
              {example.evaluationScore !== null ? (
                <span
                  className={`w-fit rounded-full px-2 py-0.5 text-xs ${
                    example.evaluationScore >= 0.6
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {example.evaluationScore >= 0.6 ? "참고자료" : "회피대상"} {Math.round(example.evaluationScore * 100)}점
                </span>
              ) : (
                <span className="w-fit rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-400">미평가</span>
              )}
            </div>
            <p className="text-sm text-neutral-700">{example.prompt}</p>
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
