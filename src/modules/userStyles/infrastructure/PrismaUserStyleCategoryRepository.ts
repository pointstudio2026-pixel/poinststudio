import { prisma } from "@/shared/database/prisma";
import type { UserStyleCategory } from "@/modules/userStyles/domain/UserStyle";
import type { UserStyleCategoryRepository } from "@/modules/userStyles/domain/UserStyleCategoryRepository";

function toCategory(row: {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}): UserStyleCategory {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaUserStyleCategoryRepository implements UserStyleCategoryRepository {
  async listByUserId(userId: string): Promise<UserStyleCategory[]> {
    const rows = await prisma.userStyleCategory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toCategory);
  }

  async findById(id: string): Promise<UserStyleCategory | null> {
    const row = await prisma.userStyleCategory.findUnique({ where: { id } });
    return row ? toCategory(row) : null;
  }

  async create(userId: string, name: string): Promise<UserStyleCategory> {
    const row = await prisma.userStyleCategory.create({ data: { userId, name } });
    return toCategory(row);
  }

  async updateDescription(id: string, description: string | null): Promise<UserStyleCategory> {
    const row = await prisma.userStyleCategory.update({ where: { id }, data: { description } });
    return toCategory(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.userStyleCategory.delete({ where: { id } });
  }
}
