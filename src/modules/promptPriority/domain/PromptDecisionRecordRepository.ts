import type { CreatePromptDecisionRecordInput, PromptDecisionRecord } from "@/modules/promptPriority/domain/PromptDecisionRecord";

export interface PromptDecisionRecordRepository {
  create(input: CreatePromptDecisionRecordInput): Promise<PromptDecisionRecord>;
  list(limit?: number): Promise<PromptDecisionRecord[]>;
  findByPromptVersionId(promptVersionId: string): Promise<PromptDecisionRecord | null>;
}
