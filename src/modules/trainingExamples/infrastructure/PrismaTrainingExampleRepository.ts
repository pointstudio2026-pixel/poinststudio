import { prisma } from "@/shared/database/prisma";
import type { TrainingExample } from "@/modules/trainingExamples/domain/TrainingExample";
import type {
  CreateTrainingExampleInput,
  TrainingExampleRepository,
} from "@/modules/trainingExamples/domain/TrainingExampleRepository";

export class PrismaTrainingExampleRepository implements TrainingExampleRepository {
  async create(input: CreateTrainingExampleInput): Promise<TrainingExample> {
    return prisma.trainingExample.create({
      data: {
        prompt: input.prompt,
        deliverableType: input.deliverableType,
        imageStorageKey: input.imageStorageKey,
        imageContentType: input.imageContentType,
        createdByUserId: input.createdByUserId,
      },
    });
  }

  async list(): Promise<TrainingExample[]> {
    return prisma.trainingExample.findMany({ orderBy: { createdAt: "desc" } });
  }

  async listByDeliverableType(deliverableType: string): Promise<TrainingExample[]> {
    return prisma.trainingExample.findMany({
      where: { deliverableType },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<TrainingExample | null> {
    return prisma.trainingExample.findUnique({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await prisma.trainingExample.delete({ where: { id } });
  }
}
