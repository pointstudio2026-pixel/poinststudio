"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { submitInquirySchema, type SubmitInquiryInput } from "@/modules/inquiries/schemas/inquiry.schemas";
import { submitInquiry, fetchInquiries } from "@/services/inquiry-service";
import { Spinner } from "@/components/Spinner";

export function SupportView() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["inquiries"],
    queryFn: fetchInquiries,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubmitInquiryInput>({
    resolver: zodResolver(submitInquirySchema),
    defaultValues: { isPublic: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await submitInquiry(values);
      reset({ subject: "", message: "", isPublic: false });
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ["inquiries"] });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "문의 접수에 실패했습니다.");
    }
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">문의사항</h1>
        <Link href="/projects" className="text-sm underline">
          내 프로젝트로
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">다른 사용자가 남긴 공개 문의도 함께 볼 수 있어요.</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm text-white transition hover:opacity-90"
        >
          {showForm ? "취소" : "새 문의 작성"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="subject" className="text-sm text-neutral-500">
              제목
            </label>
            <input
              id="subject"
              type="text"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-900"
              {...register("subject")}
            />
            {errors.subject && <p className="text-sm text-red-600">{errors.subject.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="message" className="text-sm text-neutral-500">
              내용
            </label>
            <textarea
              id="message"
              rows={6}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-900"
              {...register("message")}
            />
            {errors.message && <p className="text-sm text-red-600">{errors.message.message}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("isPublic")} />
            전체공개로 게시 (체크 안 하면 본인과 관리자만 열람 가능한 비공개 문의)
          </label>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-fit items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting && <Spinner />}
            {isSubmitting ? "제출 중..." : "문의 제출"}
          </button>
        </form>
      )}

      <ul className="flex flex-col divide-y divide-neutral-200 rounded-lg border border-neutral-200">
        {isLoading && (
          <li className="flex justify-center p-6">
            <Spinner />
          </li>
        )}
        {!isLoading && data?.inquiries.length === 0 && (
          <li className="p-6 text-center text-sm text-neutral-400">아직 등록된 문의가 없습니다.</li>
        )}
        {data?.inquiries.map((inquiry) => (
          <li key={inquiry.id}>
            <Link
              href={`/support/${inquiry.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-neutral-50"
            >
              <span className={inquiry.isPublic ? "" : "italic text-neutral-400"}>{inquiry.subject}</span>
              <span className="shrink-0 text-xs text-neutral-400">
                {new Date(inquiry.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
