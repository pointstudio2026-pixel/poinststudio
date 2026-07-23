import type { CreatePromptDecisionRecordInput, PromptDecisionRecord } from "@/modules/promptPriority/domain/PromptDecisionRecord";
import type { PromptDecisionRecordRepository } from "@/modules/promptPriority/domain/PromptDecisionRecordRepository";

export class FakePromptDecisionRecordRepository implements PromptDecisionRecordRepository {
  records: PromptDecisionRecord[] = [];
  private nextId = 1;

  async create(input: CreatePromptDecisionRecordInput): Promise<PromptDecisionRecord> {
    const record: PromptDecisionRecord = {
      id: `prompt-decision-record-${this.nextId++}`,
      ...input,
      createdAt: new Date(),
    };
    this.records.push(record);
    return record;
  }

  async list(limit = 50): Promise<PromptDecisionRecord[]> {
    return [...this.records].reverse().slice(0, limit);
  }

  async findByPromptVersionId(promptVersionId: string): Promise<PromptDecisionRecord | null> {
    return this.records.find((r) => r.promptVersionId === promptVersionId) ?? null;
  }
}
