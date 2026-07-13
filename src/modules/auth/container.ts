import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import { PrismaRefreshTokenRepository } from "@/modules/auth/infrastructure/PrismaRefreshTokenRepository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/Argon2PasswordHasher";
import { TokenService } from "@/modules/auth/application/TokenService";
import { RegisterUseCase } from "@/modules/auth/application/RegisterUseCase";
import { LoginUseCase } from "@/modules/auth/application/LoginUseCase";
import { LogoutUseCase } from "@/modules/auth/application/LogoutUseCase";
import { GetMeUseCase } from "@/modules/auth/application/GetMeUseCase";
import { RefreshTokenUseCase } from "@/modules/auth/application/RefreshTokenUseCase";

const userRepository = new PrismaUserRepository();
const refreshTokenRepository = new PrismaRefreshTokenRepository();
const passwordHasher = new Argon2PasswordHasher();
const tokenService = new TokenService(refreshTokenRepository);

export const authContainer = {
  registerUseCase: new RegisterUseCase(userRepository, passwordHasher, tokenService),
  loginUseCase: new LoginUseCase(userRepository, passwordHasher, tokenService),
  logoutUseCase: new LogoutUseCase(tokenService),
  getMeUseCase: new GetMeUseCase(userRepository),
  refreshTokenUseCase: new RefreshTokenUseCase(tokenService, userRepository),
};
