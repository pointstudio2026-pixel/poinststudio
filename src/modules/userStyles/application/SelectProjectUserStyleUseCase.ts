import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { UserStyleCategoryRepository } from "@/modules/userStyles/domain/UserStyleCategoryRepository";
import type { ProjectUserStyleSelectionRepository } from "@/modules/userStyles/domain/ProjectUserStyleSelectionRepository";
import type { ProjectUserStyleSelection } from "@/modules/userStyles/domain/UserStyle";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError } from "@/shared/errors/AppError";

/**
 * SelectLogoStyleUseCase와 달리 어떤 워크스페이스 단계도 게이팅하지 않는
 * 순수 부가 선택이다 -- "스타일" 단계 화면에서 언제든 고르고 바꿀 수 있다.
 */
export class SelectProjectUserStyleUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly userStyleCategoryRepository: UserStyleCategoryRepository,
    private readonly selectionRepository: ProjectUserStyleSelectionRepository,
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
    userStyleCategoryId: string;
  }): Promise<ProjectUserStyleSelection> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const category = await this.userStyleCategoryRepository.findById(input.userStyleCategoryId);
    if (!category || category.userId !== input.userId) {
      throw new NotFoundError("스타일 카테고리를 찾을 수 없습니다.", "USER_STYLE_CATEGORY_NOT_FOUND");
    }

    const selection = await this.selectionRepository.create(input.projectId, input.userStyleCategoryId);

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "PROJECT_USER_STYLE_SELECTED",
      payload: { userStyleCategoryId: input.userStyleCategoryId },
    });

    return selection;
  }
}
