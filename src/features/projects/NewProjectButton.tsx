"use client";

import { useState } from "react";
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

  // 마운트 시점에 한 번 도는 useEffect로 이 상태를 부모에 알리면(예: 이전
  // 구현) 그 첫 실행에서 isOpen이 항상 초기값 false라 "방금 닫혔다"로
  // 오해되어, 부모의 호버 드롭다운(PrimaryNav)이 열리자마자 스스로
  // 닫혀버리는 실제 버그가 있었다(2026-07-25 발견) -- 실제 사용자 조작으로
  // 열고 닫는 시점에만 명시적으로 알리도록 바꿔서 마운트 타이밍과 완전히
  // 무관하게 만든다.
  function openModal() {
    setIsOpen(true);
    onOpenChange?.(true);
  }
  function closeModal() {
    setIsOpen(false);
    onOpenChange?.(false);
  }

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
      closeModal();
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
        onClick={openModal}
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
                  onClick={closeModal}
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
