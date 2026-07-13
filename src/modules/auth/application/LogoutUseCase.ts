import type { TokenService } from "@/modules/auth/application/TokenService";
import { recordActivity } from "@/shared/activity/activityLogger";

export class LogoutUseCase {
  constructor(private readonly tokenService: TokenService) {}

  async execute(input: { userId: string; refreshToken?: string }): Promise<void> {
    if (input.refreshToken) {
      await this.tokenService.revoke(input.refreshToken);
    }
    await recordActivity({ userId: input.userId, eventType: "USER_LOGGED_OUT" });
  }
}
