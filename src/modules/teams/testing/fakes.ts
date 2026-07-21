import type { Team, TeamMembership } from "@/modules/teams/domain/Team";
import type { TeamRepository } from "@/modules/teams/domain/TeamRepository";
import { generateTeamCode } from "@/modules/teams/domain/teamCode";

export class FakeTeamRepository implements TeamRepository {
  teams: Team[] = [];
  memberships: TeamMembership[] = [];

  async findByOwnerId(ownerId: string) {
    return this.teams.find((t) => t.ownerId === ownerId) ?? null;
  }

  async findByCode(code: string) {
    return this.teams.find((t) => t.code === code) ?? null;
  }

  async createWithGeneratedCode(ownerId: string) {
    let code = generateTeamCode();
    while (this.teams.some((t) => t.code === code)) {
      code = generateTeamCode();
    }
    const team: Team = { id: `team-${this.teams.length + 1}`, ownerId, code, createdAt: new Date() };
    this.teams.push(team);
    return team;
  }

  async addMembership(teamId: string, userId: string) {
    const membership: TeamMembership = {
      id: `membership-${this.memberships.length + 1}`,
      teamId,
      userId,
      createdAt: new Date(),
    };
    this.memberships.push(membership);
    return membership;
  }

  async findMembership(teamId: string, userId: string) {
    return this.memberships.find((m) => m.teamId === teamId && m.userId === userId) ?? null;
  }

  async findMembershipsForUser(userId: string) {
    return this.memberships.filter((m) => m.userId === userId);
  }
}
