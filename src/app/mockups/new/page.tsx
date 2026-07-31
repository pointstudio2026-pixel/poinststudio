import { getCurrentSession } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { StandaloneMockupView } from "@/features/mockups/StandaloneMockupView";

// 2026-07-31: "목업" 단독 프로세스는 비로그인 게스트도 3회까지 쓸 수 있게
// 열었다 -- requireSessionOrRedirect() 대신 soft session 체크로 바꿔서,
// 세션이 없어도 리다이렉트하지 않고 게스트 모드로 렌더링한다.
export default async function StandaloneMockupPage() {
  const session = await getCurrentSession();
  if (!session) {
    return <StandaloneMockupView user={null} planCode={null} />;
  }
  const user = await authContainer.getMeUseCase.execute({ userId: session.sub });
  const subscription = await subscriptionsContainer.getSubscriptionUseCase.execute({ userId: session.sub });

  return <StandaloneMockupView user={{ email: user.email, name: user.name }} planCode={subscription.planCode} />;
}
