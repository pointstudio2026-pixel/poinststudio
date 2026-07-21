import { prisma } from "@/shared/database/prisma";
import type {
  AuthUser,
  CreateUserInput,
  UserRepository,
} from "@/modules/auth/domain/UserRepository";

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<AuthUser | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<AuthUser | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(input: CreateUserInput): Promise<AuthUser> {
    return prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        emailVerifiedAt: input.emailVerifiedAt,
      },
    });
  }

  async updateProfile(id: string, input: { name: string }): Promise<AuthUser> {
    return prisma.user.update({ where: { id }, data: { name: input.name } });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  async setEmailVerificationToken(id: string, token: string, expiresAt: Date): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { emailVerificationToken: token, emailVerificationTokenExpiresAt: expiresAt },
    });
  }

  async findByEmailVerificationToken(token: string): Promise<AuthUser | null> {
    return prisma.user.findFirst({
      where: { emailVerificationToken: token, emailVerificationTokenExpiresAt: { gt: new Date() } },
    });
  }

  async markEmailVerified(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }
}
