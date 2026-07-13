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
      },
    });
  }
}
