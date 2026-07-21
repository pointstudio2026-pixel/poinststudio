import { apiFetch } from "@/services/http-client";

export interface TeamDto {
  id: string;
  ownerId: string;
  code: string;
  createdAt: string;
}

export interface TeamMembershipDto {
  id: string;
  teamId: string;
  userId: string;
  createdAt: string;
}

export function registerTeam() {
  return apiFetch<{ team: TeamDto }>("/api/teams/register", { method: "POST" });
}

export function joinTeam(code: string) {
  return apiFetch<{ membership: TeamMembershipDto }>("/api/teams/join", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function fetchMyTeams() {
  return apiFetch<{ ownedTeam: TeamDto | null; memberships: TeamMembershipDto[] }>("/api/teams/me");
}
