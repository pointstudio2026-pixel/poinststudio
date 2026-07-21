"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeUserPlan,
  changeUserRole,
  createAnnouncement,
  deactivateAnnouncement,
  deleteAdminUser,
  fetchAdminAnalytics,
  fetchAdminDashboard,
  fetchAnnouncements,
  fetchAuditLogs,
  searchAdminUsers,
  suspendUser,
  unsuspendUser,
  type AdminTierDto,
} from "@/services/admin-service";

const PLAN_CODE_LABELS: Record<"free" | "pro" | "studio", string> = {
  free: "Free",
  pro: "Pro",
  studio: "Studio",
};
import { fetchCurrentUser } from "@/services/auth-service";
import { activityLabel } from "@/shared/activity/activityLabels";
import { Spinner } from "@/components/Spinner";

const ADMIN_TIER_LABELS: Record<AdminTierDto, string> = {
  super_admin: "Super Admin",
  manager: "Manager",
  support: "Support",
};

const COST_SOURCE_LABELS: Record<string, string> = {
  generation: "로고 생성",
  edit: "이미지 수정",
  mockup: "목업 생성",
  export: "Export",
  image_generation: "이미지 생성 (구분 이전 기록)",
};

export function AdminDashboardView() {
  const queryClient = useQueryClient();
  const [userQuery, setUserQuery] = useState("");
  const [announcementDraft, setAnnouncementDraft] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [userActionError, setUserActionError] = useState<string | null>(null);

  const { data: meData } = useQuery({ queryKey: ["current-user"], queryFn: fetchCurrentUser });
  const myTier = meData?.user.adminTier ?? null;
  const canManageMembers = myTier === "super_admin" || myTier === "manager";
  const canDeleteOrChangeRole = myTier === "super_admin";

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
  });
  const { data: analyticsData } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: fetchAdminAnalytics,
  });
  const { data: usersData, refetch: refetchUsers } = useQuery({
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

  async function handleSuspendToggle(userId: string, currentlySuspended: boolean) {
    setUserActionError(null);
    try {
      await (currentlySuspended ? unsuspendUser(userId) : suspendUser(userId));
      await refetchUsers();
    } catch (err) {
      setUserActionError(err instanceof Error ? err.message : "처리에 실패했습니다.");
    }
  }

  async function handleDeleteUser(userId: string) {
    setUserActionError(null);
    try {
      await deleteAdminUser(userId);
      await refetchUsers();
    } catch (err) {
      setUserActionError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  }

  async function handlePromote(userId: string, tier: AdminTierDto) {
    setUserActionError(null);
    try {
      await changeUserRole(userId, { role: "admin", adminTier: tier });
      await refetchUsers();
    } catch (err) {
      setUserActionError(err instanceof Error ? err.message : "권한 변경에 실패했습니다.");
    }
  }

  async function handleDemote(userId: string) {
    setUserActionError(null);
    try {
      await changeUserRole(userId, { role: "designer" });
      await refetchUsers();
    } catch (err) {
      setUserActionError(err instanceof Error ? err.message : "권한 변경에 실패했습니다.");
    }
  }

  async function handleChangePlan(userId: string, planCode: "free" | "pro" | "studio") {
    setUserActionError(null);
    try {
      await changeUserPlan(userId, planCode);
      await refetchUsers();
    } catch (err) {
      setUserActionError(err instanceof Error ? err.message : "요금제 변경에 실패했습니다.");
    }
  }

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
        <Link href="/projects" className="text-sm underline">
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
        <h2 className="text-sm font-medium text-neutral-700">이번 달 AI 원가 세부항목</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-neutral-400">
              <th className="pr-4">구분</th>
              <th className="pr-4">횟수</th>
              <th className="pr-4">비용</th>
            </tr>
          </thead>
          <tbody>
            {(analytics?.costBreakdown ?? []).map((entry) => (
              <tr key={entry.source}>
                <td className="pr-4">{COST_SOURCE_LABELS[entry.source] ?? entry.source}</td>
                <td className="pr-4">{entry.count}</td>
                <td className="pr-4">${entry.totalCost.toFixed(2)}</td>
              </tr>
            ))}
            {(analytics?.costBreakdown ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="text-neutral-400">
                  이번 달 기록된 비용이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-neutral-400">
          ⚠ 이 표는 이미지 생성/수정/목업 비용만 집계합니다. 브랜드 전략·인터뷰·추천 등 텍스트 생성(GPT) 비용은 아직
          추적되지 않아 실제 OpenAI 청구액이 이 합계보다 클 수 있습니다.
        </p>
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
        {userActionError && <p className="mt-2 text-sm text-red-600">{userActionError}</p>}
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-neutral-400">
              <th className="pr-4">Email</th>
              <th className="pr-4">닉네임</th>
              <th className="pr-4">등급</th>
              <th className="pr-4">상태</th>
              <th className="pr-4">Plan</th>
              <th className="pr-4">Projects</th>
              <th className="pr-4">생성 횟수</th>
              <th className="pr-4">마지막 로그인</th>
              {canManageMembers && <th className="pr-4">액션</th>}
            </tr>
          </thead>
          <tbody>
            {(usersData?.users ?? []).map((u) => (
              <tr key={u.id} className="border-t border-neutral-100">
                <td className="py-1.5 pr-4">
                  <Link href={`/ops-portal-7x2q/users/${u.id}`} className="underline underline-offset-2">
                    {u.email}
                  </Link>
                </td>
                <td className="pr-4">{u.name ?? "-"}</td>
                <td className="pr-4">{u.role === "admin" ? (u.adminTier ? ADMIN_TIER_LABELS[u.adminTier] : "admin") : "-"}</td>
                <td className="pr-4">
                  <span
                    className={
                      u.status === "suspended"
                        ? "text-amber-600"
                        : u.status === "deleted"
                          ? "text-red-600"
                          : "text-neutral-500"
                    }
                  >
                    {u.status === "active" ? "정상" : u.status === "suspended" ? "정지됨" : "삭제됨"}
                  </span>
                </td>
                <td className="pr-4">
                  {canDeleteOrChangeRole ? (
                    <select
                      value={u.planCode}
                      onChange={(e) => handleChangePlan(u.id, e.target.value as "free" | "pro" | "studio")}
                      className="rounded-md border border-neutral-300 px-1 py-1 text-xs"
                    >
                      {Object.entries(PLAN_CODE_LABELS).map(([code, label]) => (
                        <option key={code} value={code}>
                          {label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    u.planCode
                  )}
                </td>
                <td className="pr-4">{u.projectCount}</td>
                <td className="pr-4">{u.generationCount}</td>
                <td className="pr-4">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("ko-KR") : "-"}</td>
                {canManageMembers && (
                  <td className="flex flex-wrap gap-1.5 py-1.5 pr-4">
                    <button
                      type="button"
                      onClick={() => handleSuspendToggle(u.id, u.status === "suspended")}
                      className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
                    >
                      {u.status === "suspended" ? "정지 해제" : "정지"}
                    </button>
                    {canDeleteOrChangeRole && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id)}
                          className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600"
                        >
                          삭제
                        </button>
                        {u.role === "admin" ? (
                          <button
                            type="button"
                            onClick={() => handleDemote(u.id)}
                            className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
                          >
                            일반 회원으로
                          </button>
                        ) : (
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) handlePromote(u.id, e.target.value as AdminTierDto);
                            }}
                            className="rounded-md border border-neutral-300 px-1 py-1 text-xs"
                          >
                            <option value="" disabled>
                              관리자로 승격...
                            </option>
                            {Object.entries(ADMIN_TIER_LABELS).map(([tier, label]) => (
                              <option key={tier} value={tier}>
                                {label}
                              </option>
                            ))}
                          </select>
                        )}
                      </>
                    )}
                  </td>
                )}
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
