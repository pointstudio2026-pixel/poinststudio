import type { StyleRepository } from "@/modules/styles/domain/StyleRepository";
import type { StyleFavoriteRepository } from "@/modules/styles/domain/StyleFavoriteRepository";
import { NotFoundError } from "@/shared/errors/AppError";

export class ToggleStyleFavoriteUseCase {
  constructor(
    private readonly styleRepository: StyleRepository,
    private readonly styleFavoriteRepository: StyleFavoriteRepository,
  ) {}

  async execute(input: { userId: string; styleId: string; favorite: boolean }): Promise<void> {
    const style = await this.styleRepository.findById(input.styleId);
    if (!style) {
      throw new NotFoundError("스타일을 찾을 수 없습니다.", "STYLE-003");
    }

    if (input.favorite) {
      await this.styleFavoriteRepository.add(input.userId, input.styleId);
    } else {
      await this.styleFavoriteRepository.remove(input.userId, input.styleId);
    }
  }
}
