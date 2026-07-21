import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import type { Team, TeamMembership } from "@/modules/teams/domain/Team";
import type { TeamRepository } from "@/modules/teams/domain/TeamRepository";
import { generateTeamCode } from "@/modules/teams/domain/teamCode";
import { InternalError } from "@/shared/errors/AppError";

const MAX_CODE_ATTEMPTS = 5;

export class PrismaTeamRepository implements TeamRepository {
  async findByOwnerId(ownerId: string): Promise<Team | null> {
    return prisma.team.findUnique({ where: { ownerId } });
  }

  async findByCode(code: string): Promise<Team | null> {
    return prisma.team.findUnique({ where: { code } });
  }

  async createWithGeneratedCode(ownerId: string): Promise<Team> {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = generateTeamCode();
      try {
        return await prisma.team.create({ data: { ownerId, code } });
      } catch (err) {
        const isCodeCollision =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          (err.meta?.target as string[] | undefined)?.includes("code");
        if (!isCodeCollision) throw err;
      }
    }
    throw new InternalError("팀 코드 생성에 실패했습니다. 다시 시도해주세요.");
  }

  async addMembership(teamId: string, userId: string): Promise<TeamMembership> {
    return prisma.teamMembership.create({ data: { teamId, userId } });
  }

  async findMembership(teamId: string, userId: string): Promise<TeamMembership | null> {
    return prisma.teamMembership.findUnique({ where: { teamId_userId: { teamId, userId } } });
  }

  async findMembershipsForUser(userId: string): Promise<TeamMembership[]> {
    return prisma.teamMembership.findMany({ where: { userId } });
  }
}
