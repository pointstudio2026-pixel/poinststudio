import type { Team, TeamMembership } from "@/modules/teams/domain/Team";

export interface TeamRepository {
  findByOwnerId(ownerId: string): Promise<Team | null>;
  findByCode(code: string): Promise<Team | null>;
  /** Generates a unique 6-digit code and creates the Team, retrying internally on a rare collision. */
  createWithGeneratedCode(ownerId: string): Promise<Team>;
  addMembership(teamId: string, userId: string): Promise<TeamMembership>;
  findMembership(teamId: string, userId: string): Promise<TeamMembership | null>;
  findMembershipsForUser(userId: string): Promise<TeamMembership[]>;
}
