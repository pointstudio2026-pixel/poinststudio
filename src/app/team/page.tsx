import { requireSessionOrRedirect } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { teamsContainer } from "@/modules/teams/container";
import { TeamView } from "@/features/team/TeamView";

export default async function TeamPage() {
  const session = await requireSessionOrRedirect();
  const [user, subscription, myTeams] = await Promise.all([
    authContainer.getMeUseCase.execute({ userId: session.sub }),
    subscriptionsContainer.getSubscriptionUseCase.execute({ userId: session.sub }),
    teamsContainer.getMyTeamsUseCase.execute({ userId: session.sub }),
  ]);

  return (
    <TeamView
      email={user.email}
      name={user.name}
      planCode={subscription.planCode}
      ownedTeam={
        myTeams.ownedTeam
          ? { ...myTeams.ownedTeam, createdAt: myTeams.ownedTeam.createdAt.toISOString() }
          : null
      }
      memberships={myTeams.memberships.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
    />
  );
}
