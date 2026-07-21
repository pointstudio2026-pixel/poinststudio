import type { LogoStyleCategoryRepository } from "@/modules/logoStyles/domain/LogoStyleCategoryRepository";
import type { LogoStyleCategory } from "@/modules/logoStyles/domain/LogoStyle";

export class ListLogoStyleCategoriesUseCase {
  constructor(private readonly categoryRepository: LogoStyleCategoryRepository) {}

  async execute(): Promise<LogoStyleCategory[]> {
    return this.categoryRepository.listAll();
  }
}
