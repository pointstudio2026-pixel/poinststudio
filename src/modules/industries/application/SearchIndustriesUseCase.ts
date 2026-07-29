import type { IndustryRepository } from "@/modules/industries/domain/IndustryRepository";
import type { Industry } from "@/modules/industries/domain/Industry";
import type { Locale } from "@/shared/i18n/locale";

export class SearchIndustriesUseCase {
  constructor(private readonly industryRepository: IndustryRepository) {}

  async execute(query: string, locale: Locale = "ko"): Promise<Industry[]> {
    return this.industryRepository.search(query, locale);
  }
}
