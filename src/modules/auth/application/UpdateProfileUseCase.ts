import type { UserRepository } from "@/modules/auth/domain/UserRepository";
import type { UpdateProfileInput } from "@/modules/auth/schemas/auth.schemas";
import { toPublicUser, type PublicUser } from "@/modules/auth/application/publicUser";
import { recordActivity } from "@/shared/activity/activityLogger";
import { AuthenticationError } from "@/shared/errors/AppError";

export class UpdateProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: { userId: string } & UpdateProfileInput): Promise<PublicUser> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new AuthenticationError("사용자를 찾을 수 없습니다.", "AUTH-006");
    }

    const updated = await this.userRepository.updateProfile(input.userId, {
      name: input.name.trim(),
    });

    await recordActivity({ userId: input.userId, eventType: "USER_PROFILE_UPDATED" });

    return toPublicUser(updated);
  }
}
