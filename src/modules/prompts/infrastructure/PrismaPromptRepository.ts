import { Prisma } from "../../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import type { GenerationPayload, Prompt, PromptProvider, PromptVersion } from "@/modules/prompts/domain/Prompt";
import type { PromptRepository, PromptVersionInput } from "@/modules/prompts/domain/PromptRepository";

function toVersion(row: {
  id: string;
  promptId: string;
  versionNumber: number;
  provider: string;
  systemPrompt: string;
  userPrompt: string;
  hash: string;
  payload: unknown;
  flaggedTerms: string[];
  createdAt: Date;
}): PromptVersion {
  return {
    id: row.id,
    promptId: row.promptId,
    versionNumber: row.versionNumber,
    provider: row.provider as PromptProvider,
    systemPrompt: row.systemPrompt,
    userPrompt: row.userPrompt,
    hash: row.hash,
    payload: row.payload as unknown as GenerationPayload,
    flaggedTerms: row.flaggedTerms,
    createdAt: row.createdAt,
  };
}

export class PrismaPromptRepository implements PromptRepository {
  async findByProjectId(projectId: string): Promise<Prompt | null> {
    const row = await prisma.prompt.findUnique({ where: { projectId } });
    if (!row?.currentVersionId) return null;

    const versionRow = await prisma.promptVersion.findUnique({ where: { id: row.currentVersionId } });
    if (!versionRow) return null;

    return { id: row.id, projectId: row.projectId, currentVersion: toVersion(versionRow) };
  }

  async createWithFirstVersion(projectId: string, input: PromptVersionInput): Promise<Prompt> {
    const prompt = await prisma.prompt.create({ data: { projectId } });
    const version = await prisma.promptVersion.create({
      data: {
        promptId: prompt.id,
        versionNumber: 1,
        provider: input.provider,
        systemPrompt: input.systemPrompt,
        userPrompt: input.userPrompt,
        hash: input.hash,
        payload: input.payload as unknown as Prisma.InputJsonValue,
        flaggedTerms: input.flaggedTerms,
      },
    });
    await prisma.prompt.update({ where: { id: prompt.id }, data: { currentVersionId: version.id } });

    return { id: prompt.id, projectId, currentVersion: toVersion(version) };
  }

  async addVersion(promptId: string, input: PromptVersionInput): Promise<Prompt> {
    const prompt = await prisma.prompt.findUniqueOrThrow({ where: { id: promptId } });
    const lastVersion = await prisma.promptVersion.findFirst({
      where: { promptId },
      orderBy: { versionNumber: "desc" },
    });
    const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

    const version = await prisma.promptVersion.create({
      data: {
        promptId,
        versionNumber: nextVersionNumber,
        provider: input.provider,
        systemPrompt: input.systemPrompt,
        userPrompt: input.userPrompt,
        hash: input.hash,
        payload: input.payload as unknown as Prisma.InputJsonValue,
        flaggedTerms: input.flaggedTerms,
      },
    });
    await prisma.prompt.update({ where: { id: promptId }, data: { currentVersionId: version.id } });

    return { id: promptId, projectId: prompt.projectId, currentVersion: toVersion(version) };
  }

  async listVersions(promptId: string): Promise<PromptVersion[]> {
    const rows = await prisma.promptVersion.findMany({
      where: { promptId },
      orderBy: { versionNumber: "desc" },
    });
    return rows.map(toVersion);
  }

  async getVersionById(versionId: string): Promise<PromptVersion | null> {
    const row = await prisma.promptVersion.findUnique({ where: { id: versionId } });
    return row ? toVersion(row) : null;
  }
}
