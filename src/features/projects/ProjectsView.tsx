"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "@/services/dashboard-service";
import { PrimaryNav } from "@/features/navigation/PrimaryNav";
import { NewProjectButton } from "@/features/projects/NewProjectButton";
import { UsageWidget } from "@/features/subscription/UsageWidget";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { ProjectCard } from "@/features/dashboard/ProjectCard";
import { DashboardSkeleton } from "@/features/dashboard/DashboardSkeleton";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { MessageKey } from "@/shared/i18n/messages/types";

const PLAN_LABELS: Record<string, string> = { free: "Free", pro: "Pro", studio: "Studio" };

const FILTERS: { key: "all" | "progress" | "completed" | "favorite"; labelKey: MessageKey }[] = [
  { key: "all", labelKey: "dashboard.filters.all" },
  { key: "progress", labelKey: "dashboard.filters.progress" },
  { key: "completed", labelKey: "dashboard.filters.completed" },
  { key: "favorite", labelKey: "dashboard.filters.favorite" },
];

type FilterKey = (typeof FILTERS)[number]["key"];

export function ProjectsView({
  email,
  name,
  emailVerified,
}: {
  email: string;
  name: string | null;
  emailVerified: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const { t } = useTranslation();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", search],
    queryFn: () => fetchDashboard(search || undefined),
  });

  const projects = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.projects;
    if (filter === "favorite") return data.projects.filter((p) => p.isFavorite);
    return data.projects.filter((p) => p.status === filter);
  }, [data, filter]);

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between border-b border-line px-8 py-5">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          ASTER.
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/design-memory"
            className="rounded-full border border-line px-3 py-1.5 text-sm transition hover:border-ink"
          >
            {t("dashboard.designMemory")}
          </Link>
          <PrimaryNav user={{ email, name }} planCode={data?.subscription.planCode ?? "free"} />
        </div>
      </header>

      <EmailVerificationBanner emailVerified={emailVerified} />

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-8 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-sm text-muted">{t("dashboard.myProjects")}</p>
            <h1 className="mt-1 text-2xl font-semibold">{t("dashboard.heading", { email })}</h1>
            <p className="font-script mt-1 text-sm text-muted">{t("dashboard.tagline")}</p>
          </div>
          <NewProjectButton />
        </div>

        {isLoading && <DashboardSkeleton />}

        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{t("dashboard.loadError")}</p>
            <button type="button" onClick={() => refetch()} className="mt-2 underline">
              {t("dashboard.retry")}
            </button>
          </div>
        )}

        {data && (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <UsageWidget
                planCode={data.usage.planCode}
                used={data.usage.generation.used}
                limit={data.usage.generation.limit}
                remaining={data.usage.generation.remaining}
              />
              <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
                <p className="font-medium">
                  {t("dashboard.currentPlan", { plan: PLAN_LABELS[data.subscription.planCode] ?? data.subscription.planCode })}
                </p>
                <Link href="/subscription" className="text-muted underline underline-offset-4">
                  {t("dashboard.managePlan")}
                </Link>
              </div>
            </div>

            <section className="flex flex-col gap-5 border-t border-line pt-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFilter(f.key)}
                      className={`rounded-full px-3 py-1.5 text-sm transition ${
                        filter === f.key ? "bg-ink text-paper" : "border border-line hover:border-ink"
                      }`}
                    >
                      {t(f.labelKey)}
                    </button>
                  ))}
                </div>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("dashboard.searchPlaceholder")}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm outline-none transition focus:border-ink"
                />
              </div>

              {projects.length === 0 && search && (
                <p className="text-sm text-muted">{t("dashboard.noSearchResults", { query: search })}</p>
              )}
              {projects.length === 0 && !search && data.projects.length === 0 && (
                <p className="text-sm text-muted">{t("dashboard.emptyProjects")}</p>
              )}
              {projects.length === 0 && !search && data.projects.length > 0 && (
                <p className="text-sm text-muted">{t("dashboard.noMatchingProjects")}</p>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    planCode={data.subscription.planCode}
                    onDeleted={() => refetch()}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
