import type { StyleListFilter, StyleRepository } from "@/modules/styles/domain/StyleRepository";
import type { Style } from "@/modules/styles/domain/Style";

export class ListStylesUseCase {
  constructor(private readonly styleRepository: StyleRepository) {}

  async execute(filter: StyleListFilter): Promise<{ styles: Style[]; categories: Style[] }> {
    const [styles, categories] = await Promise.all([
      this.styleRepository.list({ ...filter, level: filter.level ?? 3 }),
      this.styleRepository.listCategories(),
    ]);
    return { styles, categories };
  }
}
