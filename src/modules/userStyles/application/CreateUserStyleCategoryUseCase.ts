import type { UserStyleCategoryRepository } from "@/modules/userStyles/domain/UserStyleCategoryRepository";
import type { UserStyleCategory } from "@/modules/userStyles/domain/UserStyle";
import { recordActivity } from "@/shared/activity/activityLogger";
import { ValidationError } from "@/shared/errors/AppError";

const MAX_NAME_LENGTH = 100;

export class CreateUserStyleCategoryUseCase {
  constructor(private readonly categoryRepository: UserStyleCategoryRepository) {}

  async execute(input: { userId: string; name: string }): Promise<UserStyleCategory> {
    const name = input.name.trim();
    if (!name || name.length > MAX_NAME_LENGTH) {
      throw new ValidationError(
        `카테고리 이름은 1~${MAX_NAME_LENGTH}자여야 합니다.`,
        undefined,
        "USER_STYLE-001",
      );
    }

    const category = await this.categoryRepository.create(input.userId, name);

    await recordActivity({
      userId: input.userId,
      eventType: "USER_STYLE_CATEGORY_CREATED",
      payload: { categoryId: category.id, name },
    });

    return category;
  }
}
