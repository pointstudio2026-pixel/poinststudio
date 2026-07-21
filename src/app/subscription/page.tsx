import Link from "next/link";
import { requireSessionOrRedirect } from "@/shared/auth/session";
import { subscriptionsContainer } from "@/modules/subscriptions/container";

const PLAN_LABELS: Record<string, string> = { free: "Free", pro: "Pro", studio: "Studio" };
const PLAN_PRICE_LABELS: Record<string, string> = { free: "₩0/월", pro: "₩29,000/월", studio: "₩99,000/월" };

// Free는 정확한 횟수를 그대로 보여준다(업그레이드 유도 목적, 실제로 적은
// 숫자라 굳이 숨길 이유가 없다). Pro/Studio는 정확한 한도를 대외적으로
// 공개하지 않기로 했다 -- 실제 값은 planLimits.ts에서만 관리한다. 이미
// 구독 중인 사용자 본인의 실사용량(UsageWidget)은 예외로 정확한 숫자를
// 계속 보여준다.
function formatGenerationAllowance(planCode: string, limit: number): string {
  if (planCode === "pro") return "브랜드 프로젝트에 충분한 월간 생성 횟수";
  if (planCode === "studio") return "여러 프로젝트도 여유롭게, 대용량 생성 횟수";
  return `월 ${limit}회 생성`;
}

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
        <Link href="/projects" className="text-sm underline">
          내 프로젝트로
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
              <p className="mt-1 text-lg font-semibold">{PLAN_PRICE_LABELS[plan.planCode]}</p>
              <p className="mt-2 text-sm text-neutral-500">
                {formatGenerationAllowance(plan.planCode, plan.monthlyGenerationLimit)}
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
                <p className="mt-4 text-center text-sm text-neutral-400">서비스 준비중입니다</p>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
