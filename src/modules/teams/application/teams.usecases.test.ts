import { describe, expect, it } from "vitest";
import { RegisterTeamUseCase } from "@/modules/teams/application/RegisterTeamUseCase";
import { JoinTeamUseCase } from "@/modules/teams/application/JoinTeamUseCase";
import { GetMyTeamsUseCase } from "@/modules/teams/application/GetMyTeamsUseCase";
import { FakeTeamRepository } from "@/modules/teams/testing/fakes";
import { FakeSubscriptionRepository } from "@/modules/subscriptions/testing/fakes";
import { ConflictError, AuthorizationError, NotFoundError } from "@/shared/errors/AppError";

function setup() {
  const teams = new FakeTeamRepository();
  const subs = new FakeSubscriptionRepository();
  return {
    teams,
    subs,
    register: new RegisterTeamUseCase(teams, subs),
    join: new JoinTeamUseCase(teams),
    getMyTeams: new GetMyTeamsUseCase(teams),
  };
}

describe("RegisterTeamUseCase", () => {
  it("rejects a non-Studio user (플랜 게이팅)", async () => {
    const ctx = setup();
    ctx.subs.setPlan("owner-1", "pro");

    await expect(ctx.register.execute({ userId: "owner-1" })).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("creates a team with a 6-digit code for a Studio user", async () => {
    const ctx = setup();
    ctx.subs.setPlan("owner-1", "studio");

    const team = await ctx.register.execute({ userId: "owner-1" });

    expect(team.ownerId).toBe("owner-1");
    expect(team.code).toMatch(/^\d{6}$/);
  });

  it("rejects registering a second team for the same owner (한 명당 팀 1개)", async () => {
    const ctx = setup();
    ctx.subs.setPlan("owner-1", "studio");
    await ctx.register.execute({ userId: "owner-1" });

    await expect(ctx.register.execute({ userId: "owner-1" })).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("JoinTeamUseCase", () => {
  it("rejects an unknown code", async () => {
    const ctx = setup();
    await expect(ctx.join.execute({ userId: "member-1", code: "000000" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("rejects the owner joining their own team via code", async () => {
    const ctx = setup();
    ctx.subs.setPlan("owner-1", "studio");
    const team = await ctx.register.execute({ userId: "owner-1" });

    await expect(ctx.join.execute({ userId: "owner-1", code: team.code })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("adds a membership when a valid code is entered", async () => {
    const ctx = setup();
    ctx.subs.setPlan("owner-1", "studio");
    const team = await ctx.register.execute({ userId: "owner-1" });

    const membership = await ctx.join.execute({ userId: "member-1", code: team.code });

    expect(membership.teamId).toBe(team.id);
    expect(membership.userId).toBe("member-1");
  });

  it("is idempotent -- entering the same code twice doesn't duplicate membership", async () => {
    const ctx = setup();
    ctx.subs.setPlan("owner-1", "studio");
    const team = await ctx.register.execute({ userId: "owner-1" });

    const first = await ctx.join.execute({ userId: "member-1", code: team.code });
    const second = await ctx.join.execute({ userId: "member-1", code: team.code });

    expect(second.id).toBe(first.id);
    expect(ctx.teams.memberships).toHaveLength(1);
  });
});

describe("GetMyTeamsUseCase", () => {
  it("returns both the owned team and joined memberships", async () => {
    const ctx = setup();
    ctx.subs.setPlan("owner-1", "studio");
    const team = await ctx.register.execute({ userId: "owner-1" });
    await ctx.join.execute({ userId: "member-1", code: team.code });

    const ownerView = await ctx.getMyTeams.execute({ userId: "owner-1" });
    expect(ownerView.ownedTeam?.id).toBe(team.id);
    expect(ownerView.memberships).toHaveLength(0);

    const memberView = await ctx.getMyTeams.execute({ userId: "member-1" });
    expect(memberView.ownedTeam).toBeNull();
    expect(memberView.memberships).toHaveLength(1);
  });
});
