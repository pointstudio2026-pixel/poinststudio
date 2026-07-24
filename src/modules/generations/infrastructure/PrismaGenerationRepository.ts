import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import type {
  GeneratedImage,
  Generation,
  GenerationStatus,
  GenerationVersion,
} from "@/modules/generations/domain/Generation";
import type {
  CreateGenerationVersionInput,
  GenerationRepository,
  UpdateGenerationVersionResultInput,
} from "@/modules/generations/domain/GenerationRepository";

function toVersion(row: {
  id: string;
  generationId: string;
  versionNumber: number;
  promptVersionId: string;
  status: string;
  provider: string | null;
  providerPreference: string | null;
  images: unknown;
  errorMessage: string | null;
  costAmount: Prisma.Decimal | null;
  createdAt: Date;
  completedAt: Date | null;
}): GenerationVersion {
  return {
    id: row.id,
    generationId: row.generationId,
    versionNumber: row.versionNumber,
    promptVersionId: row.promptVersionId,
    status: row.status as GenerationStatus,
    provider: row.provider,
    providerPreference: row.providerPreference,
    images: row.images as unknown as GeneratedImage[],
    errorMessage: row.errorMessage,
    costAmount: row.costAmount ? row.costAmount.toNumber() : null,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
  };
}

export class PrismaGenerationRepository implements GenerationRepository {
  async findByProjectId(projectId: string): Promise<Generation | null> {
    const row = await prisma.generation.findUnique({ where: { projectId } });
    if (!row?.currentVersionId) return null;

    const versionRow = await prisma.generationVersion.findUnique({ where: { id: row.currentVersionId } });
    if (!versionRow) return null;

    return { id: row.id, projectId: row.projectId, currentVersion: toVersion(versionRow) };
  }

  async findById(generationId: string): Promise<{ id: string; projectId: string } | null> {
    const row = await prisma.generation.findUnique({ where: { id: generationId } });
    return row ? { id: row.id, projectId: row.projectId } : null;
  }

  async createWithFirstVersion(
    projectId: string,
    input: CreateGenerationVersionInput,
  ): Promise<Generation> {
    const generation = await prisma.generation.create({ data: { projectId } });
    const version = await prisma.generationVersion.create({
      data: {
        generationId: generation.id,
        versionNumber: 1,
        promptVersionId: input.promptVersionId,
        status: "pending",
        providerPreference: input.providerPreference ?? null,
        images: [],
      },
    });
    await prisma.generation.update({
      where: { id: generation.id },
      data: { currentVersionId: version.id },
    });

    return { id: generation.id, projectId, currentVersion: toVersion(version) };
  }

  async addVersion(generationId: string, input: CreateGenerationVersionInput): Promise<Generation> {
    const generation = await prisma.generation.findUniqueOrThrow({ where: { id: generationId } });
    const lastVersion = await prisma.generationVersion.findFirst({
      where: { generationId },
      orderBy: { versionNumber: "desc" },
    });
    const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

    const version = await prisma.generationVersion.create({
      data: {
        generationId,
        versionNumber: nextVersionNumber,
        promptVersionId: input.promptVersionId,
        status: "pending",
        providerPreference: input.providerPreference ?? null,
        images: [],
      },
    });
    await prisma.generation.update({
      where: { id: generationId },
      data: { currentVersionId: version.id },
    });

    return { id: generationId, projectId: generation.projectId, currentVersion: toVersion(version) };
  }

  async getVersionById(versionId: string): Promise<GenerationVersion | null> {
    const row = await prisma.generationVersion.findUnique({ where: { id: versionId } });
    return row ? toVersion(row) : null;
  }

  async updateVersionResult(
    versionId: string,
    patch: UpdateGenerationVersionResultInput,
  ): Promise<GenerationVersion> {
    const row = await prisma.generationVersion.update({
      where: { id: versionId },
      data: {
        status: patch.status,
        ...(patch.provider !== undefined ? { provider: patch.provider } : {}),
        ...(patch.images !== undefined ? { images: patch.images as unknown as Prisma.InputJsonValue } : {}),
        ...(patch.errorMessage !== undefined ? { errorMessage: patch.errorMessage } : {}),
        ...(patch.costAmount !== undefined ? { costAmount: patch.costAmount } : {}),
        ...(patch.completedAt !== undefined ? { completedAt: patch.completedAt } : {}),
      },
    });
    return toVersion(row);
  }

  async listVersions(generationId: string): Promise<GenerationVersion[]> {
    const rows = await prisma.generationVersion.findMany({
      where: { generationId },
      orderBy: { versionNumber: "desc" },
    });
    return rows.map(toVersion);
  }

  async listCompletedWithoutEvaluation(limit: number): Promise<GenerationVersion[]> {
    const rows = await prisma.generationVersion.findMany({
      where: { status: "completed", evaluation: { is: null } },
      take: limit,
      orderBy: { completedAt: "asc" },
    });
    return rows.map(toVersion);
  }
}
