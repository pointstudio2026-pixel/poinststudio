"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createIndustry,
  deleteIndustry,
  fetchAllIndustriesForAdmin,
  updateIndustry,
  type IndustryDto,
  type IndustryFormInput,
} from "@/services/industries-service";
import { Spinner } from "@/components/Spinner";

const LOGO_STYLE_OPTIONS = ["모던", "클래식", "럭셔리", "플레이풀", "미니멀", "오가닉", "에디토리얼", "테크"];

const EMPTY_FORM: IndustryFormInput = {
  name: "",
  seoSlug: "",
  category: "",
  description: "",
  recommendedColors: [],
  recommendedLogoStyles: [],
  recommendedTypography: [],
  recommendedPersonality: [],
  recommendedKeywords: [],
  isActive: true,
};

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function IndustriesAdminView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IndustryFormInput>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const industriesQuery = useQuery({ queryKey: ["admin-industries"], queryFn: fetchAllIndustriesForAdmin });

  const createMutation = useMutation({
    mutationFn: (input: IndustryFormInput) => createIndustry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-industries"] });
      setForm(EMPTY_FORM);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "저장에 실패했습니다."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<IndustryFormInput> }) => updateIndustry(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-industries"] });
      setEditingId(null);
      setForm(EMPTY_FORM);
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "수정에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIndustry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-industries"] }),
  });

  function startEdit(industry: IndustryDto) {
    setEditingId(industry.id);
    setForm({
      name: industry.name,
      seoSlug: industry.seoSlug,
      category: industry.category,
      description: industry.description,
      recommendedColors: industry.recommendedColors,
      recommendedLogoStyles: industry.recommendedLogoStyles,
      recommendedTypography: industry.recommendedTypography,
      recommendedPersonality: industry.recommendedPersonality,
      recommendedKeywords: industry.recommendedKeywords,
      isActive: industry.isActive,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function submit() {
    if (editingId) {
      updateMutation.mutate({ id: editingId, input: form });
    } else {
      createMutation.mutate(form);
    }
  }

  const industries = industriesQuery.data?.industries ?? [];
  const filtered = industries.filter(
    (i) =>
      !search.trim() ||
      i.name.includes(search) ||
      i.category.includes(search) ||
      i.recommendedKeywords.some((k) => k.includes(search)),
  );
  const categories = Array.from(new Set(industries.map((i) => i.category)));

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-5 sm:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">업종 카탈로그</h1>
          <p className="mt-1 text-sm text-muted">
            {industries.length}개 업종 · {categories.length}개 카테고리 · 인터뷰 검색형 드롭다운/브랜드 전략 프롬프트가
            여기서 데이터를 가져옵니다.
          </p>
        </div>
        <Link href="/ops-portal-7x2q" className="text-sm underline">
          관리자 홈으로
        </Link>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-medium">{editingId ? "업종 수정" : "새 업종 추가"}</h2>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-muted">
            이름 (인터뷰 답변으로 그대로 저장됨)
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-line px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            SEO 슬러그 (영문, kebab-case)
            <input
              type="text"
              value={form.seoSlug}
              onChange={(e) => setForm({ ...form, seoSlug: e.target.value })}
              className="rounded-lg border border-line px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            카테고리 (그룹핑)
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              list="industry-categories"
              className="rounded-lg border border-line px-3 py-2 text-sm text-ink"
            />
            <datalist id="industry-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            활성 상태
            <select
              value={form.isActive ? "active" : "inactive"}
              onChange={(e) => setForm({ ...form, isActive: e.target.value === "active" })}
              className="rounded-lg border border-line px-3 py-2 text-sm text-ink"
            >
              <option value="active">활성 (검색/인터뷰에 노출)</option>
              <option value="inactive">비활성 (숨김)</option>
            </select>
          </label>
          <label className="col-span-2 flex flex-col gap-1 text-xs text-muted">
            설명
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="rounded-lg border border-line px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            추천 컬러 (쉼표로 구분)
            <input
              type="text"
              value={form.recommendedColors.join(", ")}
              onChange={(e) => setForm({ ...form, recommendedColors: parseCsv(e.target.value) })}
              placeholder="#5C4033, 웜 브라운"
              className="rounded-lg border border-line px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            추천 타이포그래피 (쉼표로 구분)
            <input
              type="text"
              value={form.recommendedTypography.join(", ")}
              onChange={(e) => setForm({ ...form, recommendedTypography: parseCsv(e.target.value) })}
              className="rounded-lg border border-line px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            추천 브랜드 성격 (쉼표로 구분)
            <input
              type="text"
              value={form.recommendedPersonality.join(", ")}
              onChange={(e) => setForm({ ...form, recommendedPersonality: parseCsv(e.target.value) })}
              className="rounded-lg border border-line px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            검색 키워드 (쉼표로 구분)
            <input
              type="text"
              value={form.recommendedKeywords.join(", ")}
              onChange={(e) => setForm({ ...form, recommendedKeywords: parseCsv(e.target.value) })}
              className="rounded-lg border border-line px-3 py-2 text-sm text-ink"
            />
          </label>
          <fieldset className="col-span-2 flex flex-col gap-1 text-xs text-muted">
            추천 로고 스타일
            <div className="flex flex-wrap gap-2">
              {LOGO_STYLE_OPTIONS.map((style) => {
                const checked = form.recommendedLogoStyles.includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        recommendedLogoStyles: checked
                          ? form.recommendedLogoStyles.filter((s) => s !== style)
                          : [...form.recommendedLogoStyles, style],
                      })
                    }
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      checked ? "border-ink bg-ink text-paper" : "border-line text-ink hover:border-ink"
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={createMutation.isPending || updateMutation.isPending || !form.name.trim() || !form.seoSlug.trim()}
            className="flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-sm text-paper transition hover:opacity-90 disabled:opacity-50"
          >
            {(createMutation.isPending || updateMutation.isPending) && <Spinner />}
            {editingId ? "수정 저장" : "업종 추가"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full border border-line px-5 py-2 text-sm transition hover:border-ink"
            >
              취소
            </button>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름/카테고리/키워드로 검색..."
          className="rounded-full border border-line px-4 py-2 text-sm"
        />

        {industriesQuery.isLoading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {!industriesQuery.isLoading && (
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs text-muted">
                <tr>
                  <th className="px-4 py-2">이름</th>
                  <th className="px-4 py-2">카테고리</th>
                  <th className="px-4 py-2">슬러그</th>
                  <th className="px-4 py-2">상태</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((industry) => (
                  <tr key={industry.id} className="border-t border-line">
                    <td className="px-4 py-2 font-medium">{industry.name}</td>
                    <td className="px-4 py-2 text-muted">{industry.category}</td>
                    <td className="px-4 py-2 text-muted">{industry.seoSlug}</td>
                    <td className="px-4 py-2">
                      {industry.isActive ? (
                        <span className="text-green-700">활성</span>
                      ) : (
                        <span className="text-muted">비활성</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button type="button" onClick={() => startEdit(industry)} className="mr-3 text-xs underline">
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`"${industry.name}"을(를) 삭제할까요?`)) deleteMutation.mutate(industry.id);
                        }}
                        className="text-xs text-red-600 underline"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
