"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getWorkspaceSteps } from "@/modules/projects/domain/Project";
import { STEP_ROUTES, STEP_LABEL_MESSAGE_KEYS } from "@/features/workspace/stepRoutes";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

export function ProjectSidebar({
  projectId,
  currentStep,
  deliverableType,
  planCode,
}: {
  projectId: string;
  currentStep: string;
  deliverableType: string | null;
  planCode: PlanCode;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const steps = getWorkspaceSteps(deliverableType);
  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <aside className="w-full flex-shrink-0 lg:sticky lg:top-16 lg:w-[220px] lg:self-start">
      <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {steps.map((step, i) => {
          const route = STEP_ROUTES[step.key];
          const href = route ? `/projects/${projectId}/${route}` : null;
          const isActive = Boolean(href && pathname === href);
          const label = t(STEP_LABEL_MESSAGE_KEYS[step.key] ?? "workspaceSteps.deliverableType");
          const className = `whitespace-nowrap rounded-full px-3.5 py-2.5 text-sm transition ${
            isActive
              ? "bg-ink text-paper"
              : i < currentStepIndex
                ? "text-ink hover:bg-surface"
                : "text-muted hover:bg-surface"
          }`;

          if (!href) {
            return (
              <span key={step.key} className={className}>
                {label}
              </span>
            );
          }

          return (
            <Link key={step.key} href={href} className={className}>
              {label}
            </Link>
          );
        })}
      </nav>

      <Link
        href={`/projects/${projectId}/export`}
        className={`mt-4 block rounded-full border px-3.5 py-2.5 text-center text-sm transition hover:border-ink ${
          pathname === `/projects/${projectId}/export` ? "border-ink bg-ink text-paper" : "border-line"
        }`}
      >
        {t("workspaceSteps.exportCenter")}
      </Link>
    </aside>
  );
}
