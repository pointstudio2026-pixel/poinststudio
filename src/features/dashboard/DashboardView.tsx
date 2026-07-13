"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "@/services/dashboard-service";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { NewProjectButton } from "@/features/projects/NewProjectButton";
import { UsageWidget } from "@/features/subscription/UsageWidget";
import { ProjectCard } from "@/features/dashboard/ProjectCard";
import { DashboardSkeleton } from "@/features/dashboard/DashboardSkeleton";
import { activityLabel } from "@/shared/activity/activityLabels";

const PLAN_LABELS: Record<string, string> = { free: "Free", pro: "Pro", studio: "Studio" };

export function DashboardView({ email }: { email: string }) {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", search],
    queryFn: () => fetchDashboard(search || undefined),
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-neutral-500">{email}님, 환영합니다.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/design-memory" className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm">
            Design Memory
          </Link>
          <NewProjectButton />
          <LogoutButton />
        </div>
      </header>

      {isLoading && <DashboardSkeleton />}

      {isError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>대시보드를 불러오지 못했습니다.</p>
          <button type="button" onClick={() => refetch()} className="mt-2 underline">
            다시 시도
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
            <div className="rounded-md border border-neutral-200 px-4 py-3 text-sm">
              <p className="font-medium">현재 플랜: {PLAN_LABELS[data.subscription.planCode]}</p>
              <Link href="/subscription" className="text-neutral-500 underline">
                플랜 관리
              </Link>
            </div>
          </div>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-700">최근 프로젝트</h2>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="프로젝트 검색"
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
              />
            </div>

            {data.projects.length === 0 && search && (
              <p className="text-sm text-neutral-500">&ldquo;{search}&rdquo; 검색 결과가 없습니다.</p>
            )}
            {data.projects.length === 0 && !search && (
              <p className="text-sm text-neutral-500">
                아직 프로젝트가 없습니다. 새 프로젝트를 시작해보세요.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {data.projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-neutral-700">최근 활동</h2>
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-neutral-500">아직 활동 내역이 없습니다.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm text-neutral-500">
                {data.recentActivity.map((activity) => (
                  <li key={activity.id}>
                    {activityLabel(activity.eventType)} ·{" "}
                    {new Date(activity.createdAt).toLocaleString("ko-KR")}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
