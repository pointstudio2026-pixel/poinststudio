import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/Argon2PasswordHasher";
import { RegisterUseCase } from "@/modules/auth/application/RegisterUseCase";
import { LoginUseCase } from "@/modules/auth/application/LoginUseCase";
import { LogoutUseCase } from "@/modules/auth/application/LogoutUseCase";
import { GetMeUseCase } from "@/modules/auth/application/GetMeUseCase";

const userRepository = new PrismaUserRepository();
const passwordHasher = new Argon2PasswordHasher();

export const authContainer = {
  registerUseCase: new RegisterUseCase(userRepository, passwordHasher),
  loginUseCase: new LoginUseCase(userRepository, passwordHasher),
  logoutUseCase: new LogoutUseCase(),
  getMeUseCase: new GetMeUseCase(userRepository),
};
