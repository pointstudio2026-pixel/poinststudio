"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAnnouncement,
  deactivateAnnouncement,
  fetchAdminAnalytics,
  fetchAdminDashboard,
  fetchAnnouncements,
  fetchAuditLogs,
  searchAdminUsers,
} from "@/services/admin-service";
import { activityLabel } from "@/shared/activity/activityLabels";
import { Spinner } from "@/components/Spinner";

export function AdminDashboardView() {
  const queryClient = useQueryClient();
  const [userQuery, setUserQuery] = useState("");
  const [announcementDraft, setAnnouncementDraft] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
  });
  const { data: analyticsData } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: fetchAdminAnalytics,
  });
  const { data: usersData } = useQuery({
    queryKey: ["admin-users", userQuery],
    queryFn: () => searchAdminUsers(userQuery || undefined),
  });
  const { data: auditData } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: () => fetchAuditLogs(),
  });
  const { data: announcementsData } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: fetchAnnouncements,
  });

  async function handleCreateAnnouncement() {
    if (!announcementDraft.trim()) return;
    setActionError(null);
    try {
      await createAnnouncement(announcementDraft.trim());
      setAnnouncementDraft("");
      await queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "공지 등록에 실패했습니다.");
    }
  }

  async function handleDeactivateAnnouncement(id: string) {
    await deactivateAnnouncement(id);
    await queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const summary = dashboardData?.summary;
  const analytics = analyticsData?.analytics;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <Link href="/dashboard" className="text-sm underline">
          일반 화면으로
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Daily Active Users" value={summary?.dailyActiveUsers ?? 0} />
        <StatTile label="New Projects Today" value={summary?.newProjectsToday ?? 0} />
        <StatTile
          label="이번 달 AI 원가"
          value={analytics ? `$${analytics.totalCostThisMonth.toFixed(2)}` : "-"}
        />
        <StatTile
          label="평균 실패율"
          value={
            summary
              ? `${Math.round(
                  (summary.errorRates.reduce((sum, r) => sum + r.errorRate, 0) / Math.max(summary.errorRates.length, 1)) *
                    100,
                )}%`
              : "-"
          }
        />
      </section>

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">플랜별 사용자 분포</h2>
        <div className="mt-2 flex gap-4 text-sm">
          {(summary?.planDistribution ?? []).map((p) => (
            <span key={p.planCode}>
              {p.planCode}: {p.userCount}명
            </span>
          ))}
          {(summary?.planDistribution ?? []).length === 0 && (
            <span className="text-neutral-400">데이터 없음 (실제 결제 연동 전, Task-023 범위)</span>
          )}
        </div>
      </section>

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">Provider Health</h2>
        <div className="mt-2 flex gap-3">
          {(summary?.providerHealth ?? []).map((p) => (
            <div
              key={p.provider}
              className={`rounded-md border px-3 py-2 text-sm ${
                p.healthy ? "border-green-300 bg-green-50 text-green-700" : "border-red-300 bg-red-50 text-red-700"
              }`}
            >
              {p.provider} ({p.name}) — {p.healthy ? "정상" : "장애"}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">Queue 상태</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-neutral-400">
              <th className="pr-4">Queue</th>
              <th className="pr-4">대기</th>
              <th className="pr-4">진행중</th>
              <th className="pr-4">완료</th>
              <th className="pr-4">실패</th>
            </tr>
          </thead>
          <tbody>
            {(summary?.queueStatus ?? []).map((q) => (
              <tr key={q.queue}>
                <td className="pr-4">{q.queue}</td>
                <td className="pr-4">{q.waiting}</td>
                <td className="pr-4">{q.active}</td>
                <td className="pr-4">{q.completed}</td>
                <td className="pr-4">{q.failed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">Usage Trend (최근 14일, image_generation)</h2>
        <div className="mt-2 flex items-end gap-1">
          {(analytics?.usageTrend ?? []).map((point) => (
            <div key={point.date} className="flex flex-col items-center gap-1">
              <div
                className="w-4 bg-neutral-900"
                style={{ height: `${Math.max(point.count * 8, 2)}px` }}
                title={`${point.date}: ${point.count}`}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">사용자 검색</h2>
        <input
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          placeholder="이메일로 검색"
          className="mt-2 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm"
        />
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-neutral-400">
              <th className="pr-4">Email</th>
              <th className="pr-4">Role</th>
              <th className="pr-4">Plan</th>
              <th className="pr-4">Projects</th>
            </tr>
          </thead>
          <tbody>
            {(usersData?.users ?? []).map((u) => (
              <tr key={u.id}>
                <td className="pr-4">{u.email}</td>
                <td className="pr-4">{u.role}</td>
                <td className="pr-4">{u.planCode}</td>
                <td className="pr-4">{u.projectCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">시스템 공지</h2>
        <div className="mt-2 flex gap-2">
          <input
            value={announcementDraft}
            onChange={(e) => setAnnouncementDraft(e.target.value)}
            placeholder="공지 내용"
            className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={handleCreateAnnouncement}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white"
          >
            등록
          </button>
        </div>
        {actionError && <p className="mt-1 text-sm text-red-600">{actionError}</p>}
        <ul className="mt-3 flex flex-col gap-1">
          {(announcementsData?.announcements ?? []).map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm">
              <span>{a.message}</span>
              <button type="button" onClick={() => handleDeactivateAnnouncement(a.id)} className="text-xs underline">
                비활성화
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">Audit Log</h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {(auditData?.logs ?? []).map((log) => (
            <li key={log.id} className="flex items-center justify-between text-xs text-neutral-500">
              <span>
                {activityLabel(log.eventType)} · {log.userId ?? "-"}
              </span>
              <span>{new Date(log.createdAt).toLocaleString("ko-KR")}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-neutral-200 p-4">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
