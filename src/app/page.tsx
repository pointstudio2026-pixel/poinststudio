import { getCurrentSession } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { HomeView } from "@/features/landing/HomeView";

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
