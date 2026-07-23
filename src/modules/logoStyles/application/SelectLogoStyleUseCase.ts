import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { LogoStyleCategoryRepository } from "@/modules/logoStyles/domain/LogoStyleCategoryRepository";
import type { LogoStyleSelectionRepository } from "@/modules/logoStyles/domain/LogoStyleSelectionRepository";
import type { LogoStyleSelection } from "@/modules/logoStyles/domain/LogoStyle";
import { MAX_LOGO_STYLE_SELECTIONS } from "@/modules/logoStyles/domain/logoStyleRules";
import { getWorkspaceSteps } from "@/modules/projects/domain/Project";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

export class SelectLogoStyleUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly categoryRepository: LogoStyleCategoryRepository,
    private readonly selectionRepository: LogoStyleSelectionRepository,
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
    categoryIds: string[];
    forbiddenCategoryIds?: string[];
  }): Promise<LogoStyleSelection> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    if (input.categoryIds.length === 0 || input.categoryIds.length > MAX_LOGO_STYLE_SELECTIONS) {
      throw new ValidationError(
        `로고 스타일은 1개 이상 ${MAX_LOGO_STYLE_SELECTIONS}개 이하로 선택할 수 있습니다.`,
        undefined,
        "LOGO_STYLE-001",
      );
    }

    const categories = await this.categoryRepository.findByIds(input.categoryIds);
    if (categories.length !== input.categoryIds.length) {
      throw new NotFoundError("선택한 로고 스타일을 찾을 수 없습니다.", "LOGO_STYLE-002");
    }

    const forbiddenCategoryIds = input.forbiddenCategoryIds ?? [];
    if (forbiddenCategoryIds.length > 0) {
      const forbiddenSet = new Set(forbiddenCategoryIds);
      const overlapping = categories.filter((c) => forbiddenSet.has(c.id));
      if (overlapping.length > 0) {
        throw new ValidationError(
          `"${overlapping.map((c) => c.name).join(", ")}"은(는) 선택한 로고 스타일이면서 동시에 금지 로고 스타일로 지정됐습니다.`,
          undefined,
          "LOGO_STYLE-004",
        );
      }
    }

    const selection = await this.selectionRepository.create(
      input.projectId,
      input.categoryIds,
      input.categoryIds[0]!,
      forbiddenCategoryIds,
    );

    const steps = getWorkspaceSteps(project.deliverableType);
    const stepIndex = steps.findIndex((s) => s.key === "logo_style");
    const nextStep = steps[stepIndex + 1];
    if (nextStep && project.currentStep === "logo_style") {
      await this.projectRepository.save({ ...project, currentStep: nextStep.key, updatedAt: new Date() });
    }

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "LOGO_STYLE_SELECTED",
      payload: { categoryIds: input.categoryIds },
    });

    return selection;
  }
}
