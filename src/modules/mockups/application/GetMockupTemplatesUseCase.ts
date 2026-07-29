import type { MockupTemplateRepository } from "@/modules/mockups/domain/MockupTemplateRepository";
import type { MockupCategory, MockupTemplate } from "@/modules/mockups/domain/Mockup";
import type { Locale } from "@/shared/i18n/locale";

export class GetMockupTemplatesUseCase {
  constructor(private readonly templateRepository: MockupTemplateRepository) {}

  async execute(input: { category?: MockupCategory; locale?: Locale }): Promise<{
    templates: MockupTemplate[];
    categories: MockupCategory[];
  }> {
    const [templates, categories] = await Promise.all([
      this.templateRepository.list(input.category, input.locale),
      this.templateRepository.listCategories(),
    ]);
    return { templates, categories };
  }
}
