import type { TeamRepository } from "@/modules/teams/domain/TeamRepository";
import type { Team, TeamMembership } from "@/modules/teams/domain/Team";

export interface GetMyTeamsOutput {
  ownedTeam: Team | null;
  memberships: TeamMembership[];
}

export class GetMyTeamsUseCase {
  constructor(private readonly teamRepository: TeamRepository) {}

  async execute(input: { userId: string }): Promise<GetMyTeamsOutput> {
    const [ownedTeam, memberships] = await Promise.all([
      this.teamRepository.findByOwnerId(input.userId),
      this.teamRepository.findMembershipsForUser(input.userId),
    ]);

    return { ownedTeam, memberships };
  }
}
