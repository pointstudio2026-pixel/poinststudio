import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import type { TrainingExample, TrainingExampleEvaluationBreakdownEntry } from "@/modules/trainingExamples/domain/TrainingExample";
import type {
  CreateTrainingExampleInput,
  TrainingExampleRepository,
} from "@/modules/trainingExamples/domain/TrainingExampleRepository";

type Row = {
  id: string;
  prompt: string;
  deliverableType: string;
  imageStorageKey: string;
  imageContentType: string;
  createdByUserId: string;
  createdAt: Date;
  evaluationScore: number | null;
  evaluationBreakdown: Prisma.JsonValue | null;
  evaluatedAt: Date | null;
  source: string;
  sourceGenerationVersionId: string | null;
  category: string;
  industry: string | null;
};

function toDomain(row: Row): TrainingExample {
  return {
    id: row.id,
    prompt: row.prompt,
    deliverableType: row.deliverableType,
    imageStorageKey: row.imageStorageKey,
    imageContentType: row.imageContentType,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt,
    evaluationScore: row.evaluationScore,
    evaluationBreakdown: row.evaluationBreakdown as unknown as Record<string, TrainingExampleEvaluationBreakdownEntry> | null,
    evaluatedAt: row.evaluatedAt,
    source: row.source,
    sourceGenerationVersionId: row.sourceGenerationVersionId,
    category: row.category,
    industry: row.industry,
  };
}

export class PrismaTrainingExampleRepository implements TrainingExampleRepository {
  async create(input: CreateTrainingExampleInput): Promise<TrainingExample> {
    const row = await prisma.trainingExample.create({
      data: {
        prompt: input.prompt,
        deliverableType: input.deliverableType,
        imageStorageKey: input.imageStorageKey,
        imageContentType: input.imageContentType,
        createdByUserId: input.createdByUserId,
        evaluationScore: input.evaluationScore ?? null,
        evaluationBreakdown: (input.evaluationBreakdown ?? undefined) as unknown as Prisma.InputJsonValue,
        evaluatedAt: input.evaluatedAt ?? null,
        source: input.source ?? "ADMIN",
        sourceGenerationVersionId: input.sourceGenerationVersionId ?? null,
        category: input.category ?? "이미지생성",
        industry: input.industry ?? null,
      },
    });
    return toDomain(row);
  }

  async list(): Promise<TrainingExample[]> {
    const rows = await prisma.trainingExample.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(toDomain);
  }

  async listByDeliverableType(deliverableType: string, category?: string): Promise<TrainingExample[]> {
    const rows = await prisma.trainingExample.findMany({
      where: { deliverableType, ...(category ? { category } : {}) },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<TrainingExample | null> {
    const row = await prisma.trainingExample.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async delete(id: string): Promise<void> {
    await prisma.trainingExample.delete({ where: { id } });
  }

  async deleteLowestScoring(count: number): Promise<number> {
    if (count <= 0) return 0;
    const targets = await prisma.trainingExample.findMany({
      orderBy: [{ evaluationScore: "asc" }, { createdAt: "asc" }],
      take: count,
      select: { id: true },
    });
    if (targets.length === 0) return 0;
    const result = await prisma.trainingExample.deleteMany({
      where: { id: { in: targets.map((t) => t.id) } },
    });
    return result.count;
  }
}
