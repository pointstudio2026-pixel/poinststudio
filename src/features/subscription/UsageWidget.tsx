"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchUsageSummary } from "@/services/subscription-service";

const PLAN_LABELS: Record<string, string> = { free: "Free", pro: "Pro", studio: "Studio" };

export function UsageWidget() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["usage-summary"],
    queryFn: fetchUsageSummary,
  });

  if (isLoading) {
    return <p className="text-sm text-neutral-500">사용량을 불러오는 중...</p>;
  }
  if (isError || !data) {
    return null;
  }

  const { used, limit, remaining } = data.generation;

  return (
    <div className="w-full max-w-sm rounded-md border border-neutral-200 px-4 py-3 text-sm">
      <p className="font-medium">{PLAN_LABELS[data.planCode]} 플랜 · 이번 달 이미지 생성</p>
      <p className="text-neutral-500">
        {used} / {limit} 사용 (남음 {remaining})
      </p>
    </div>
  );
}
