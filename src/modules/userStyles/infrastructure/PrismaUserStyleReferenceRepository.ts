import { prisma } from "@/shared/database/prisma";
import type { UserStyleReference } from "@/modules/userStyles/domain/UserStyle";
import type { UserStyleReferenceRepository } from "@/modules/userStyles/domain/UserStyleReferenceRepository";

function toReference(row: {
  id: string;
  categoryId: string;
  storageKey: string;
  contentType: string;
  createdAt: Date;
}): UserStyleReference {
  return {
    id: row.id,
    categoryId: row.categoryId,
    storageKey: row.storageKey,
    contentType: row.contentType,
    createdAt: row.createdAt,
  };
}

export class PrismaUserStyleReferenceRepository implements UserStyleReferenceRepository {
  async addToCategory(categoryId: string, storageKey: string, contentType: string): Promise<UserStyleReference> {
    const row = await prisma.userStyleReference.create({ data: { categoryId, storageKey, contentType } });
    return toReference(row);
  }

  async listByCategoryId(categoryId: string): Promise<UserStyleReference[]> {
    const rows = await prisma.userStyleReference.findMany({
      where: { categoryId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toReference);
  }

  async findById(id: string): Promise<UserStyleReference | null> {
    const row = await prisma.userStyleReference.findUnique({ where: { id } });
    return row ? toReference(row) : null;
  }

  async deleteById(id: string): Promise<void> {
    await prisma.userStyleReference.delete({ where: { id } });
  }
}
