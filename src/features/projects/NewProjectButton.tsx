"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema, type CreateProjectInput } from "@/modules/projects/schemas/project.schemas";
import { createProject } from "@/services/project-service";
import { Spinner } from "@/components/Spinner";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

export function NewProjectButton({
  variant = "pill",
  onOpenChange,
}: {
  variant?: "pill" | "menu-item";
  /** 이 버튼이 호버형 드롭다운 안에 놓일 때, 부모가 모달이 열려있는 동안
   * onMouseLeave로 자신을 접어(=이 컴포넌트를 언마운트해) 모달까지 같이
   * 사라지지 않도록 막을 수 있게 열림 상태를 알려준다. */
  onOpenChange?: (isOpen: boolean) => void;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

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
      setServerError(err instanceof Error ? err.message : t("dashboard.newProject.genericError"));
    }
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          variant === "menu-item"
            ? "w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-paper"
            : "rounded-full bg-ink px-4 py-1.5 text-sm text-paper transition hover:opacity-90"
        }
      >
        {t("dashboard.newProject.button")}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("dashboard.newProject.modalTitle")}</h2>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="project-name" className="text-sm font-medium text-ink">
                  {t("dashboard.newProject.nameLabel")}
                </label>
                <input
                  id="project-name"
                  type="text"
                  autoFocus
                  className="rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none transition focus:border-ink"
                  {...register("name")}
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>

              {serverError && <p className="text-sm text-red-600">{serverError}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-line px-4 py-2 text-sm transition hover:border-ink"
                >
                  {t("dashboard.newProject.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper transition hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting && <Spinner />}
                  {isSubmitting ? t("dashboard.newProject.submitting") : t("dashboard.newProject.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
