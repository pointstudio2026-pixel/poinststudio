import { recordActivity } from "@/shared/activity/activityLogger";

export class LogoutUseCase {
  async execute(input: { userId: string }): Promise<void> {
    await recordActivity({ userId: input.userId, eventType: "USER_LOGGED_OUT" });
  }
}
