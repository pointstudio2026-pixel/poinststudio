import { prisma } from "@/shared/database/prisma";
import type { HardConstraintSet, SoftPreferenceSet } from "@/modules/promptPriority/domain/HardConstraint";
import type { ConflictResult } from "@/modules/promptPriority/domain/conflictDetection";
import type { PromptComplianceResult } from "@/modules/promptPriority/domain/promptComplianceCheck";
import type {
  CreatePromptDecisionRecordInput,
  PromptDecisionRecord,
} from "@/modules/promptPriority/domain/PromptDecisionRecord";
import type { PromptDecisionRecordRepository } from "@/modules/promptPriority/domain/PromptDecisionRecordRepository";
import { Prisma } from "../../../../generated/prisma/client";

type PrismaPromptDecisionRecordRow = {
  id: string;
  promptVersionId: string;
  hardConstraints: Prisma.JsonValue;
  softPreferences: Prisma.JsonValue;
  dbCandidatesFound: Prisma.JsonValue;
  dbCandidatesUsed: Prisma.JsonValue;
  conflicts: Prisma.JsonValue;
  complianceCheck: Prisma.JsonValue;
  createdAt: Date;
};

function toDomain(row: PrismaPromptDecisionRecordRow): PromptDecisionRecord {
  return {
    id: row.id,
    promptVersionId: row.promptVersionId,
    hardConstraints: row.hardConstraints as unknown as HardConstraintSet,
    softPreferences: row.softPreferences as unknown as SoftPreferenceSet,
    dbCandidatesFound: row.dbCandidatesFound as unknown as string[],
    dbCandidatesUsed: row.dbCandidatesUsed as unknown as string[],
    conflicts: row.conflicts as unknown as ConflictResult[],
    complianceCheck: row.complianceCheck as unknown as PromptComplianceResult,
    createdAt: row.createdAt,
  };
}

export class PrismaPromptDecisionRecordRepository implements PromptDecisionRecordRepository {
  async create(input: CreatePromptDecisionRecordInput): Promise<PromptDecisionRecord> {
    const row = await prisma.promptDecisionRecord.create({
      data: {
        promptVersionId: input.promptVersionId,
        hardConstraints: input.hardConstraints as unknown as Prisma.InputJsonValue,
        softPreferences: input.softPreferences as unknown as Prisma.InputJsonValue,
        dbCandidatesFound: input.dbCandidatesFound as unknown as Prisma.InputJsonValue,
        dbCandidatesUsed: input.dbCandidatesUsed as unknown as Prisma.InputJsonValue,
        conflicts: input.conflicts as unknown as Prisma.InputJsonValue,
        complianceCheck: input.complianceCheck as unknown as Prisma.InputJsonValue,
      },
    });
    return toDomain(row);
  }

  async list(limit = 50): Promise<PromptDecisionRecord[]> {
    const rows = await prisma.promptDecisionRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toDomain);
  }

  async findByPromptVersionId(promptVersionId: string): Promise<PromptDecisionRecord | null> {
    const row = await prisma.promptDecisionRecord.findUnique({ where: { promptVersionId } });
    return row ? toDomain(row) : null;
  }
}
