import type { UserRepository } from "@/modules/auth/domain/UserRepository";
import { toPublicUser, type PublicUser } from "@/modules/auth/application/publicUser";
import { AuthenticationError } from "@/shared/errors/AppError";

export class GetMeUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: { userId: string }): Promise<PublicUser> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new AuthenticationError("사용자를 찾을 수 없습니다.", "AUTH-006");
    }
    return toPublicUser(user);
  }
}
