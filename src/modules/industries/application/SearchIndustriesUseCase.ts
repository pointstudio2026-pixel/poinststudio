import type { IndustryRepository } from "@/modules/industries/domain/IndustryRepository";
import type { Industry } from "@/modules/industries/domain/Industry";

export class SearchIndustriesUseCase {
  constructor(private readonly industryRepository: IndustryRepository) {}

  async execute(query: string): Promise<Industry[]> {
    return this.industryRepository.search(query);
  }
}
