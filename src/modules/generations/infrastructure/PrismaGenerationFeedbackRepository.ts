import { prisma } from "@/shared/database/prisma";
import type { GenerationFeedback, SubmitGenerationFeedbackInput } from "@/modules/generations/domain/GenerationFeedback";
import type { GenerationFeedbackRepository } from "@/modules/generations/domain/GenerationFeedbackRepository";

function toDomain(row: {
  id: string;
  generationVersionId: string;
  likedTags: string[];
  dislikedTags: string[];
  freeText: string | null;
  createdAt: Date;
}): GenerationFeedback {
  return {
    id: row.id,
    generationVersionId: row.generationVersionId,
    likedTags: row.likedTags,
    dislikedTags: row.dislikedTags,
    freeText: row.freeText,
    createdAt: row.createdAt,
  };
}

export class PrismaGenerationFeedbackRepository implements GenerationFeedbackRepository {
  async upsert(input: SubmitGenerationFeedbackInput): Promise<GenerationFeedback> {
    const row = await prisma.generationFeedback.upsert({
      where: { generationVersionId: input.generationVersionId },
      create: {
        generationVersionId: input.generationVersionId,
        likedTags: input.likedTags,
        dislikedTags: input.dislikedTags,
        freeText: input.freeText,
      },
      update: {
        likedTags: input.likedTags,
        dislikedTags: input.dislikedTags,
        freeText: input.freeText,
      },
    });
    return toDomain(row);
  }

  async findByGenerationVersionId(generationVersionId: string): Promise<GenerationFeedback | null> {
    const row = await prisma.generationFeedback.findUnique({ where: { generationVersionId } });
    return row ? toDomain(row) : null;
  }
}
