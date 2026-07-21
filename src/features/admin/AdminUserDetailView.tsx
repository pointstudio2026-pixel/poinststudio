"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminUserDetail, type AdminTierDto } from "@/services/admin-service";
import { activityLabel } from "@/shared/activity/activityLabels";
import { Spinner } from "@/components/Spinner";

const ADMIN_TIER_LABELS: Record<AdminTierDto, string> = {
  super_admin: "Super Admin",
  manager: "Manager",
  support: "Support",
};

export function AdminUserDetailView({ userId }: { userId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: () => fetchAdminUserDetail(userId),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-8">
        <Link href="/ops-portal-7x2q" className="text-sm underline">
          ← 관리자 대시보드로
        </Link>
        <p className="text-sm text-red-600">사용자 정보를 불러오지 못했습니다.</p>
      </main>
    );
  }

  const { profile, recentActivity, usage } = data.detail;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <Link href="/ops-portal-7x2q" className="text-sm underline">
          ← 관리자 대시보드로
        </Link>
      </header>

      <section className="rounded-md border border-neutral-200 p-4">
        <h1 className="text-lg font-semibold">{profile.name ?? profile.email}</h1>
        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-3">
          <DetailRow label="Email" value={profile.email} />
          <DetailRow label="닉네임" value={profile.name ?? "-"} />
          <DetailRow
            label="등급"
            value={profile.role === "admin" ? (profile.adminTier ? ADMIN_TIER_LABELS[profile.adminTier] : "admin") : "일반 회원"}
          />
          <DetailRow
            label="상태"
            value={profile.status === "active" ? "정상" : profile.status === "suspended" ? "정지됨" : "삭제됨"}
          />
          <DetailRow label="Plan" value={profile.planCode} />
          <DetailRow label="프로젝트 수" value={String(profile.projectCount)} />
          <DetailRow label="생성 횟수" value={String(profile.generationCount)} />
          <DetailRow
            label="마지막 로그인"
            value={profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString("ko-KR") : "-"}
          />
          <DetailRow label="가입일" value={new Date(profile.createdAt).toLocaleString("ko-KR")} />
        </dl>
      </section>

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">이번 달 사용량</h2>
        <p className="mt-2 text-sm">
          {usage.planCode} 플랜 · 이미지 생성 {usage.generation.used} / {usage.generation.limit} (남음{" "}
          {usage.generation.remaining})
        </p>
      </section>

      <section className="rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-medium text-neutral-700">최근 활동</h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {recentActivity.map((log) => (
            <li key={log.id} className="flex items-center justify-between text-xs text-neutral-500">
              <span>{activityLabel(log.eventType)}</span>
              <span>{new Date(log.createdAt).toLocaleString("ko-KR")}</span>
            </li>
          ))}
          {recentActivity.length === 0 && <li className="text-xs text-neutral-400">활동 기록이 없습니다.</li>}
        </ul>
      </section>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-neutral-400">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
