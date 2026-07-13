import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import type { Style } from "@/modules/styles/domain/Style";
import type { StyleFavoriteRepository } from "@/modules/styles/domain/StyleFavoriteRepository";

export class PrismaStyleFavoriteRepository implements StyleFavoriteRepository {
  async add(userId: string, styleId: string): Promise<void> {
    try {
      await prisma.styleFavorite.create({ data: { userId, styleId } });
    } catch (err) {
      // Already favorited (unique[userId, styleId]) -- treat as a no-op.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return;
      }
      throw err;
    }
  }

  async remove(userId: string, styleId: string): Promise<void> {
    await prisma.styleFavorite.deleteMany({ where: { userId, styleId } });
  }

  async listByUserId(userId: string): Promise<Style[]> {
    const rows = await prisma.styleFavorite.findMany({
      where: { userId },
      include: { style: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.style.id,
      name: row.style.name,
      slug: row.style.slug,
      level: row.style.level as 1 | 2 | 3,
      parentId: row.style.parentId,
      category: row.style.category,
      keywords: row.style.keywords,
      description: row.style.description,
    }));
  }
}
