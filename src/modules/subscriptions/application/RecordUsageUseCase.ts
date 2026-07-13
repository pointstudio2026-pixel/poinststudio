import type { RecordUsageInput, UsageRepository } from "@/modules/subscriptions/domain/UsageRepository";

export class RecordUsageUseCase {
  constructor(private readonly usageRepository: UsageRepository) {}

  async execute(input: RecordUsageInput): Promise<void> {
    await this.usageRepository.record(input);
  }
}
