import type { UserStyleCategoryRepository } from "@/modules/userStyles/domain/UserStyleCategoryRepository";
import type { UserStyleReferenceRepository } from "@/modules/userStyles/domain/UserStyleReferenceRepository";
import type { FileStorage } from "@/shared/storage/FileStorage";
import { NotFoundError } from "@/shared/errors/AppError";

export class DeleteUserStyleCategoryUseCase {
  constructor(
    private readonly categoryRepository: UserStyleCategoryRepository,
    private readonly referenceRepository: UserStyleReferenceRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: { userId: string; categoryId: string }): Promise<void> {
    const category = await this.categoryRepository.findById(input.categoryId);
    if (!category || category.userId !== input.userId) {
      throw new NotFoundError("스타일 카테고리를 찾을 수 없습니다.", "USER_STYLE_CATEGORY_NOT_FOUND");
    }

    const references = await this.referenceRepository.listByCategoryId(category.id);
    for (const reference of references) {
      await this.fileStorage.delete(reference.storageKey);
    }

    // references/projectSelections는 DB에서 onDelete: Cascade로 함께 삭제된다.
    await this.categoryRepository.delete(category.id);
  }
}
