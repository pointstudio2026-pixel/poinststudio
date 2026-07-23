import { prisma } from "@/shared/database/prisma";
import type {
  CreateGenerationEvaluationInput,
  GenerationEvaluation,
} from "@/modules/generations/domain/GenerationEvaluation";
import type { GenerationEvaluationRepository } from "@/modules/generations/domain/GenerationEvaluationRepository";

function toDomain(row: {
  id: string;
  generationVersionId: string;
  status: string;
  hardConstraintPassed: boolean;
  issues: unknown;
  usageScore: number | null;
  promotedToReference: boolean;
  createdAt: Date;
}): GenerationEvaluation {
  return {
    id: row.id,
    generationVersionId: row.generationVersionId,
    status: row.status,
    hardConstraintPassed: row.hardConstraintPassed,
    issues: row.issues as string[],
    usageScore: row.usageScore,
    promotedToReference: row.promotedToReference,
    createdAt: row.createdAt,
  };
}

export class PrismaGenerationEvaluationRepository implements GenerationEvaluationRepository {
  async create(input: CreateGenerationEvaluationInput): Promise<GenerationEvaluation> {
    const row = await prisma.generationEvaluation.create({
      data: {
        generationVersionId: input.generationVersionId,
        status: input.status,
        hardConstraintPassed: input.hardConstraintPassed,
        issues: input.issues,
      },
    });
    return toDomain(row);
  }

  async findByGenerationVersionId(generationVersionId: string): Promise<GenerationEvaluation | null> {
    const row = await prisma.generationEvaluation.findUnique({ where: { generationVersionId } });
    return row ? toDomain(row) : null;
  }

  async updateUsageScore(id: string, usageScore: number, promotedToReference: boolean): Promise<GenerationEvaluation> {
    const row = await prisma.generationEvaluation.update({
      where: { id },
      data: { usageScore, promotedToReference },
    });
    return toDomain(row);
  }

  async listUnscored(limit: number): Promise<GenerationEvaluation[]> {
    const rows = await prisma.generationEvaluation.findMany({
      where: { usageScore: null },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    return rows.map(toDomain);
  }
}
