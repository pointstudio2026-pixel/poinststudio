import type { UserStyleCategoryRepository } from "@/modules/userStyles/domain/UserStyleCategoryRepository";
import type { UserStyleReferenceRepository } from "@/modules/userStyles/domain/UserStyleReferenceRepository";
import type { UserStyleCategory, UserStyleReference } from "@/modules/userStyles/domain/UserStyle";

export interface UserStyleCategoryWithReferences extends UserStyleCategory {
  references: UserStyleReference[];
}

/** 계정 전체 목록 -- projectId 불필요, 어느 프로젝트에서든 동일한 목록을 본다. */
export class ListUserStyleCategoriesUseCase {
  constructor(
    private readonly categoryRepository: UserStyleCategoryRepository,
    private readonly referenceRepository: UserStyleReferenceRepository,
  ) {}

  async execute(input: { userId: string }): Promise<UserStyleCategoryWithReferences[]> {
    const categories = await this.categoryRepository.listByUserId(input.userId);
    return Promise.all(
      categories.map(async (category) => ({
        ...category,
        references: await this.referenceRepository.listByCategoryId(category.id),
      })),
    );
  }
}
