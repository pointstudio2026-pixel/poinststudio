import type { UserRepository } from "@/modules/auth/domain/UserRepository";
import type { PasswordHasher } from "@/modules/auth/domain/PasswordHasher";
import type { RegisterInput } from "@/modules/auth/schemas/auth.schemas";
import { toPublicUser, type PublicUser } from "@/modules/auth/application/publicUser";
import type { TokenService } from "@/modules/auth/application/TokenService";
import { recordActivity } from "@/shared/activity/activityLogger";
import { ConflictError } from "@/shared/errors/AppError";

export interface RegisterOutput {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("이미 사용 중인 이메일입니다.", "EMAIL_ALREADY_EXISTS");
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepository.create({
      email: input.email,
      passwordHash,
      name: input.name,
    });

    await recordActivity({ userId: user.id, eventType: "USER_REGISTERED" });

    const tokens = await this.tokenService.issueTokenPair({ id: user.id, role: user.role });

    return { user: toPublicUser(user), ...tokens };
  }
}
