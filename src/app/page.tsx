import type { Metadata } from "next";
import { getCurrentSession } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { HomeView } from "@/features/landing/HomeView";
import { BASE_URL } from "@/shared/seo/baseUrl";

// 루트 레이아웃의 generateMetadata는 모든 라우트가 공유하므로 여기서
// canonical을 넣으면 안 된다(계정/대시보드 페이지까지 홈 URL이 canonical로
// 잘못 찍힌다) -- 홈페이지 전용 canonical은 페이지 레벨에서만 얹는다.
export const metadata: Metadata = {
  alternates: { canonical: BASE_URL },
};

export default async function HomePage() {
  const session = await getCurrentSession();
  const user = session ? await authContainer.getMeUseCase.execute({ userId: session.sub }) : null;
  const subscription = session
    ? await subscriptionsContainer.getSubscriptionUseCase.execute({ userId: session.sub })
    : null;

  return (
    <HomeView
      user={user ? { email: user.email, name: user.name } : null}
      planCode={subscription?.planCode ?? null}
    />
  );
}
