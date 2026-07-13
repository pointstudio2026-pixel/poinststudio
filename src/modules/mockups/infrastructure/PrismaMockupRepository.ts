import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import type { MockupCategory, MockupProject } from "@/modules/mockups/domain/Mockup";
import type {
  CreateMockupInput,
  MockupRepository,
  UpdateMockupResultInput,
} from "@/modules/mockups/domain/MockupRepository";
import type { GenerationStatus } from "@/modules/generations/domain/Generation";

function toMockup(row: {
  id: string;
  projectId: string;
  generationVersionId: string;
  sourceImageIndex: number;
  templateId: string;
  status: string;
  resultImageUrl: string | null;
  thumbnailUrl: string | null;
  provider: string | null;
  isFavorite: boolean;
  errorMessage: string | null;
  costAmount: Prisma.Decimal | null;
  createdAt: Date;
  completedAt: Date | null;
}): MockupProject {
  return {
    id: row.id,
    projectId: row.projectId,
    generationVersionId: row.generationVersionId,
    sourceImageIndex: row.sourceImageIndex,
    templateId: row.templateId,
    status: row.status as GenerationStatus,
    resultImageUrl: row.resultImageUrl,
    thumbnailUrl: row.thumbnailUrl,
    provider: row.provider,
    isFavorite: row.isFavorite,
    errorMessage: row.errorMessage,
    costAmount: row.costAmount ? row.costAmount.toNumber() : null,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
  };
}

export class PrismaMockupRepository implements MockupRepository {
  async create(input: CreateMockupInput): Promise<MockupProject> {
    const row = await prisma.mockupProject.create({
      data: {
        projectId: input.projectId,
        generationVersionId: input.generationVersionId,
        sourceImageIndex: input.sourceImageIndex,
        templateId: input.templateId,
        status: "pending",
      },
    });
    return toMockup(row);
  }

  async getById(id: string): Promise<MockupProject | null> {
    const row = await prisma.mockupProject.findUnique({ where: { id } });
    return row ? toMockup(row) : null;
  }

  async updateResult(id: string, patch: UpdateMockupResultInput): Promise<MockupProject> {
    const row = await prisma.mockupProject.update({
      where: { id },
      data: {
        status: patch.status,
        ...(patch.resultImageUrl !== undefined ? { resultImageUrl: patch.resultImageUrl } : {}),
        ...(patch.thumbnailUrl !== undefined ? { thumbnailUrl: patch.thumbnailUrl } : {}),
        ...(patch.provider !== undefined ? { provider: patch.provider } : {}),
        ...(patch.errorMessage !== undefined ? { errorMessage: patch.errorMessage } : {}),
        ...(patch.costAmount !== undefined ? { costAmount: patch.costAmount } : {}),
        ...(patch.completedAt !== undefined ? { completedAt: patch.completedAt } : {}),
      },
    });
    return toMockup(row);
  }

  async setFavorite(id: string, favorite: boolean): Promise<MockupProject> {
    const row = await prisma.mockupProject.update({ where: { id }, data: { isFavorite: favorite } });
    return toMockup(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.mockupProject.delete({ where: { id } });
  }

  async listByProjectId(projectId: string, category?: MockupCategory): Promise<MockupProject[]> {
    const rows = await prisma.mockupProject.findMany({
      where: { projectId, ...(category ? { template: { category } } : {}) },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toMockup);
  }
}
