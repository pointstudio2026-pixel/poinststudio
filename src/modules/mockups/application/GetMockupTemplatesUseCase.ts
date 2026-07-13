import type { MockupTemplateRepository } from "@/modules/mockups/domain/MockupTemplateRepository";
import type { MockupCategory, MockupTemplate } from "@/modules/mockups/domain/Mockup";

export class GetMockupTemplatesUseCase {
  constructor(private readonly templateRepository: MockupTemplateRepository) {}

  async execute(input: { category?: MockupCategory }): Promise<{
    templates: MockupTemplate[];
    categories: MockupCategory[];
  }> {
    const [templates, categories] = await Promise.all([
      this.templateRepository.list(input.category),
      this.templateRepository.listCategories(),
    ]);
    return { templates, categories };
  }
}
