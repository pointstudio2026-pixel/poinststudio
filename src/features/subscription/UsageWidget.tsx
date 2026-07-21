const PLAN_LABELS: Record<string, string> = { free: "Free", pro: "Pro", studio: "Studio" };

export interface UsageWidgetProps {
  planCode: string;
  used: number;
  limit: number;
  remaining: number;
}

export function UsageWidget({ planCode, used, limit, remaining }: UsageWidgetProps) {
  const isNearLimit = limit > 0 && remaining / limit <= 0.2;

  return (
    <div className="w-full max-w-sm rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
      <p className="font-medium">{PLAN_LABELS[planCode] ?? planCode} 플랜 · 이번 달 이미지 생성</p>
      <p className={isNearLimit ? "text-amber-600" : "text-muted"}>
        {used} / {limit} 사용 (남음 {remaining})
        {isNearLimit && " · 한도에 가까워지고 있어요"}
      </p>
    </div>
  );
}
