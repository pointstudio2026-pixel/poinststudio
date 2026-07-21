import type { TeamRepository } from "@/modules/teams/domain/TeamRepository";
import type { TeamMembership } from "@/modules/teams/domain/Team";
import { NotFoundError, ConflictError } from "@/shared/errors/AppError";

export class JoinTeamUseCase {
  constructor(private readonly teamRepository: TeamRepository) {}

  async execute(input: { userId: string; code: string }): Promise<TeamMembership> {
    const team = await this.teamRepository.findByCode(input.code);
    if (!team) {
      throw new NotFoundError("존재하지 않는 팀 코드입니다.", "TEAM_NOT_FOUND");
    }
    if (team.ownerId === input.userId) {
      throw new ConflictError("이미 이 팀의 소유자입니다.", "TEAM-003");
    }

    // 이미 멤버면 새로 만들지 않고 그대로 반환 -- 코드를 다시 입력해도
    // 에러 없이 멱등하게 동작한다.
    const existing = await this.teamRepository.findMembership(team.id, input.userId);
    if (existing) return existing;

    return this.teamRepository.addMembership(team.id, input.userId);
  }
}
