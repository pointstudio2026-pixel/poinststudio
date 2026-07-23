import type { PromptDecisionRecordRepository } from "@/modules/promptPriority/domain/PromptDecisionRecordRepository";
import type { PromptDecisionRecord } from "@/modules/promptPriority/domain/PromptDecisionRecord";

export class ListPromptDecisionRecordsUseCase {
  constructor(private readonly repository: PromptDecisionRecordRepository) {}

  async execute(input: { limit?: number } = {}): Promise<PromptDecisionRecord[]> {
    return this.repository.list(input.limit);
  }
}
