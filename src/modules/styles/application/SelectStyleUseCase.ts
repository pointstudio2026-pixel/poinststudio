import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { StyleRepository } from "@/modules/styles/domain/StyleRepository";
import type { StyleSelectionRepository } from "@/modules/styles/domain/StyleSelectionRepository";
import type { StyleSelection } from "@/modules/styles/domain/Style";
import { MAX_SECONDARY_STYLES, findConflict } from "@/modules/styles/domain/styleRules";
import { WORKSPACE_STEPS } from "@/modules/projects/domain/Project";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

export class SelectStyleUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly styleRepository: StyleRepository,
    private readonly styleSelectionRepository: StyleSelectionRepository,
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
    primaryStyleId: string;
    secondaryStyleIds: string[];
  }): Promise<StyleSelection> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    if (input.secondaryStyleIds.length > MAX_SECONDARY_STYLES) {
      throw new ValidationError(
        `Secondary Style은 최대 ${MAX_SECONDARY_STYLES}개까지 선택할 수 있습니다.`,
        undefined,
        "STYLE-002",
      );
    }

    const primary = await this.styleRepository.findById(input.primaryStyleId);
    if (!primary) {
      throw new NotFoundError("선택한 스타일을 찾을 수 없습니다.", "STYLE-003");
    }
    const secondaries = await this.styleRepository.findByIds(input.secondaryStyleIds);
    if (secondaries.length !== input.secondaryStyleIds.length) {
      throw new NotFoundError("선택한 스타일을 찾을 수 없습니다.", "STYLE-003");
    }

    const conflict = findConflict({ primary, secondaries });
    if (conflict) {
      throw new ValidationError(
        `"${conflict.a.name}"과(와) "${conflict.b.name}"은(는) 함께 선택할 수 없는 조합입니다.`,
        undefined,
        "STYLE-002",
      );
    }

    const selection = await this.styleSelectionRepository.create(
      input.projectId,
      input.primaryStyleId,
      input.secondaryStyleIds,
    );

    const stepIndex = WORKSPACE_STEPS.findIndex((s) => s.key === "style");
    const nextStep = WORKSPACE_STEPS[stepIndex + 1];
    if (nextStep && project.currentStep === "style") {
      await this.projectRepository.save({ ...project, currentStep: nextStep.key, updatedAt: new Date() });
    }

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "STYLE_SELECTED",
      payload: { primaryStyleId: input.primaryStyleId, secondaryStyleIds: input.secondaryStyleIds },
    });

    return selection;
  }
}
