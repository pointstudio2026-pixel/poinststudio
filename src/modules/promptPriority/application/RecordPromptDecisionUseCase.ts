import type { PromptDecisionRecordRepository } from "@/modules/promptPriority/domain/PromptDecisionRecordRepository";
import type { CreatePromptDecisionRecordInput, PromptDecisionRecord } from "@/modules/promptPriority/domain/PromptDecisionRecord";

/** BuildPromptUseCase가 프롬프트 조립을 마친 직후 호출하는 얇은 래퍼 -- 독립적으로 단위 테스트 가능하도록 인라인하지 않았다. */
export class RecordPromptDecisionUseCase {
  constructor(private readonly repository: PromptDecisionRecordRepository) {}

  async execute(input: CreatePromptDecisionRecordInput): Promise<PromptDecisionRecord> {
    return this.repository.create(input);
  }
}
