import type { MockupTemplateRepository } from "@/modules/mockups/domain/MockupTemplateRepository";
import type { MockupTemplate } from "@/modules/mockups/domain/Mockup";
import type { Locale } from "@/shared/i18n/locale";

/** "목업" 단독 프로세스의 배경 검색 단계 -- 키워드 하나로 카테고리를 안 가리고 찾는다. */
export class SearchMockupTemplatesUseCase {
  constructor(private readonly templateRepository: MockupTemplateRepository) {}

  async execute(input: { query: string; locale?: Locale }): Promise<MockupTemplate[]> {
    return this.templateRepository.search(input.query, input.locale);
  }
}
