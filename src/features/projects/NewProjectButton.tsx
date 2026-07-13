"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema, type CreateProjectInput } from "@/modules/projects/schemas/project.schemas";
import { createProject } from "@/services/project-service";
import { Spinner } from "@/components/Spinner";

export function NewProjectButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({ resolver: zodResolver(createProjectSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const { projectId } = await createProject(values.name);
      setIsOpen(false);
      reset();
      router.push(`/projects/${projectId}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "프로젝트 생성에 실패했습니다.");
    }
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-neutral-900 px-4 py-2 text-white"
      >
        새 프로젝트
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-semibold">새 프로젝트</h2>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="project-name" className="text-sm font-medium">
                  프로젝트 이름
                </label>
                <input
                  id="project-name"
                  type="text"
                  autoFocus
                  className="rounded-md border border-neutral-300 px-3 py-2"
                  {...register("name")}
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>

              {serverError && <p className="text-sm text-red-600">{serverError}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md border border-neutral-300 px-4 py-2"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
                >
                  {isSubmitting && <Spinner />}
                  {isSubmitting ? "생성 중..." : "생성"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
