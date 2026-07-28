import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import type { StandaloneMockup, StandaloneMockupSourceType } from "@/modules/mockups/domain/StandaloneMockup";
import type {
  CreateStandaloneMockupInput,
  StandaloneMockupRepository,
} from "@/modules/mockups/domain/StandaloneMockupRepository";
import type { GenerationStatus } from "@/modules/generations/domain/Generation";

function toDomain(row: {
  id: string;
  userId: string;
  projectId: string;
  templateId: string;
  sourceType: string;
  status: string;
  resultImageUrl: string | null;
  thumbnailUrl: string | null;
  provider: string | null;
  errorMessage: string | null;
  costAmount: Prisma.Decimal | null;
  createdAt: Date;
}): StandaloneMockup {
  return {
    id: row.id,
    userId: row.userId,
    projectId: row.projectId,
    templateId: row.templateId,
    sourceType: row.sourceType as StandaloneMockupSourceType,
    status: row.status as GenerationStatus,
    resultImageUrl: row.resultImageUrl,
    thumbnailUrl: row.thumbnailUrl,
    provider: row.provider,
    errorMessage: row.errorMessage,
    costAmount: row.costAmount ? row.costAmount.toNumber() : null,
    createdAt: row.createdAt,
  };
}

export class PrismaStandaloneMockupRepository implements StandaloneMockupRepository {
  async create(input: CreateStandaloneMockupInput): Promise<StandaloneMockup> {
    const row = await prisma.standaloneMockup.create({
      data: {
        userId: input.userId,
        projectId: input.projectId,
        templateId: input.templateId,
        sourceType: input.sourceType,
        status: input.status,
        resultImageUrl: input.resultImageUrl ?? null,
        thumbnailUrl: input.thumbnailUrl ?? null,
        provider: input.provider ?? null,
        errorMessage: input.errorMessage ?? null,
        costAmount: input.costAmount ?? null,
      },
    });
    return toDomain(row);
  }

  async listByUserId(userId: string, limit = 50): Promise<StandaloneMockup[]> {
    const rows = await prisma.standaloneMockup.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toDomain);
  }
}
