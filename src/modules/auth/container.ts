import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import { PrismaRefreshTokenRepository } from "@/modules/auth/infrastructure/PrismaRefreshTokenRepository";
import { PrismaOAuthAccountRepository } from "@/modules/auth/infrastructure/PrismaOAuthAccountRepository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/Argon2PasswordHasher";
import { TokenService } from "@/modules/auth/application/TokenService";
import { RegisterUseCase } from "@/modules/auth/application/RegisterUseCase";
import { LoginUseCase } from "@/modules/auth/application/LoginUseCase";
import { OAuthLoginUseCase } from "@/modules/auth/application/OAuthLoginUseCase";
import { CompleteOAuthSignupUseCase } from "@/modules/auth/application/CompleteOAuthSignupUseCase";
import { LogoutUseCase } from "@/modules/auth/application/LogoutUseCase";
import { GetMeUseCase } from "@/modules/auth/application/GetMeUseCase";
import { RefreshTokenUseCase } from "@/modules/auth/application/RefreshTokenUseCase";
import { UpdateProfileUseCase } from "@/modules/auth/application/UpdateProfileUseCase";
import { ChangePasswordUseCase } from "@/modules/auth/application/ChangePasswordUseCase";
import { VerifyEmailUseCase } from "@/modules/auth/application/VerifyEmailUseCase";
import { ResendVerificationEmailUseCase } from "@/modules/auth/application/ResendVerificationEmailUseCase";
import { EnsureEmailVerifiedUseCase } from "@/modules/auth/application/EnsureEmailVerifiedUseCase";
import { resolveEmailProvider } from "@/shared/email/emailRouter";

const userRepository = new PrismaUserRepository();
const refreshTokenRepository = new PrismaRefreshTokenRepository();
const oauthAccountRepository = new PrismaOAuthAccountRepository();
const passwordHasher = new Argon2PasswordHasher();
const tokenService = new TokenService(refreshTokenRepository);
// userStyles의 vision provider와 동일하게 요청마다 바뀔 이유가 없어 컨테이너
// 로드 시 1회만 해석한다.
const emailProvider = resolveEmailProvider();

export const authContainer = {
  registerUseCase: new RegisterUseCase(userRepository, passwordHasher, tokenService, emailProvider),
  loginUseCase: new LoginUseCase(userRepository, passwordHasher, tokenService),
  oauthLoginUseCase: new OAuthLoginUseCase(userRepository, oauthAccountRepository, tokenService),
  completeOAuthSignupUseCase: new CompleteOAuthSignupUseCase(userRepository, oauthAccountRepository, tokenService),
  logoutUseCase: new LogoutUseCase(tokenService),
  getMeUseCase: new GetMeUseCase(userRepository),
  refreshTokenUseCase: new RefreshTokenUseCase(tokenService, userRepository),
  updateProfileUseCase: new UpdateProfileUseCase(userRepository),
  changePasswordUseCase: new ChangePasswordUseCase(userRepository, passwordHasher),
  verifyEmailUseCase: new VerifyEmailUseCase(userRepository),
  resendVerificationEmailUseCase: new ResendVerificationEmailUseCase(userRepository, emailProvider),
  ensureEmailVerifiedUseCase: new EnsureEmailVerifiedUseCase(userRepository),
};
