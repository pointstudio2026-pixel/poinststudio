import type { TeamRepository } from "@/modules/teams/domain/TeamRepository";
import type { Team } from "@/modules/teams/domain/Team";
import type { SubscriptionRepository } from "@/modules/subscriptions/domain/SubscriptionRepository";
import { ConflictError, AuthorizationError } from "@/shared/errors/AppError";

export class RegisterTeamUseCase {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(input: { userId: string }): Promise<Team> {
    const existing = await this.teamRepository.findByOwnerId(input.userId);
    if (existing) {
      throw new ConflictError("이미 등록된 팀이 있습니다.", "TEAM-001");
    }

    const subscription = await this.subscriptionRepository.findByUserId(input.userId);
    if (subscription?.planCode !== "studio") {
      throw new AuthorizationError("스튜디오 플랜에서만 팀을 등록할 수 있습니다.", "TEAM-002");
    }

    return this.teamRepository.createWithGeneratedCode(input.userId);
  }
}
