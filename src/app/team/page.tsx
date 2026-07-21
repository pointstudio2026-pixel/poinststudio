import { requireSessionOrRedirect } from "@/shared/auth/session";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { teamsContainer } from "@/modules/teams/container";
import { TeamView } from "@/features/team/TeamView";

export default async function TeamPage() {
  const session = await requireSessionOrRedirect();
  const [subscription, myTeams] = await Promise.all([
    subscriptionsContainer.getSubscriptionUseCase.execute({ userId: session.sub }),
    teamsContainer.getMyTeamsUseCase.execute({ userId: session.sub }),
  ]);

  return (
    <TeamView
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
