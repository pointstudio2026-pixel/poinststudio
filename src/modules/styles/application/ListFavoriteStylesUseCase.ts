import type { StyleFavoriteRepository } from "@/modules/styles/domain/StyleFavoriteRepository";
import type { Style } from "@/modules/styles/domain/Style";

export class ListFavoriteStylesUseCase {
  constructor(private readonly styleFavoriteRepository: StyleFavoriteRepository) {}

  async execute(input: { userId: string }): Promise<Style[]> {
    return this.styleFavoriteRepository.listByUserId(input.userId);
  }
}
