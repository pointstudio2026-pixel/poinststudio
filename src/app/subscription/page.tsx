import Link from "next/link";
import { requireSessionOrRedirect } from "@/shared/auth/session";
import { subscriptionsContainer } from "@/modules/subscriptions/container";

const PLAN_LABELS: Record<string, string> = { free: "Free", pro: "Pro", studio: "Studio" };

// Task-023(Payment Integration)에서 "업그레이드" 버튼이 실제 결제로
// 연결된다. 지금은 플랜 비교와 "업그레이드 준비 구조"만 제공한다
// (19_PRD_Subscription.md: "제외 - 실제 PG 결제 연동").
export default async function SubscriptionPage() {
  const session = await requireSessionOrRedirect();
  const subscription = await subscriptionsContainer.getSubscriptionUseCase.execute({
    userId: session.sub,
  });
  const plans = subscriptionsContainer.getPlansUseCase.execute();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">구독 플랜</h1>
        <Link href="/dashboard" className="text-sm underline">
          대시보드로
        </Link>
      </div>
      <p className="text-sm text-neutral-500">
        현재 플랜: {PLAN_LABELS[subscription.planCode]}
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.planCode === subscription.planCode;
          return (
            <div
              key={plan.planCode}
              className={`rounded-lg border p-4 ${isCurrent ? "border-neutral-900" : "border-neutral-200"}`}
            >
              <h2 className="font-medium">{PLAN_LABELS[plan.planCode]}</h2>
              <p className="mt-2 text-sm text-neutral-500">
                월 {plan.monthlyGenerationLimit}회 생성
              </p>
              <p className="text-sm text-neutral-500">
                {plan.maxResolution === "high" ? "고해상도" : "기본 해상도"}
              </p>
              <p className="text-sm text-neutral-500">
                {plan.priorityQueue ? "우선 처리 큐" : "일반 큐"}
              </p>
              {isCurrent ? (
                <p className="mt-4 text-center text-sm text-neutral-400">현재 플랜</p>
              ) : (
                <button
                  type="button"
                  disabled
                  title="결제 연동은 추후 제공됩니다."
                  className="mt-4 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-400 disabled:cursor-not-allowed"
                >
                  업그레이드 (준비 중)
                </button>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
