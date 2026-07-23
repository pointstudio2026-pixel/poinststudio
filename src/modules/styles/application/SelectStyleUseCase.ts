import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { StyleRepository } from "@/modules/styles/domain/StyleRepository";
import type { StyleSelectionRepository } from "@/modules/styles/domain/StyleSelectionRepository";
import type { StyleSelection } from "@/modules/styles/domain/Style";
import { MAX_SECONDARY_STYLES, findConflict } from "@/modules/styles/domain/styleRules";
import { getWorkspaceSteps } from "@/modules/projects/domain/Project";
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
    forbiddenStyleIds?: string[];
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

    // 하드제약 선택 시점 거부: 새로 제출한 금지 스타일 목록이 지금 선택한
    // 필수(Primary/Secondary) 스타일과 겹치면 즉시 거부한다 -- 위
    // findConflict()와 같은 "선택 시점에 막는다" 원칙을 하드제약에도 적용.
    const forbiddenStyleIds = input.forbiddenStyleIds ?? [];
    if (forbiddenStyleIds.length > 0) {
      const forbiddenSet = new Set(forbiddenStyleIds);
      const overlapping = [primary, ...secondaries].filter((s) => forbiddenSet.has(s.id));
      if (overlapping.length > 0) {
        throw new ValidationError(
          `"${overlapping.map((s) => s.name).join(", ")}"은(는) 선택한 스타일이면서 동시에 금지 스타일로 지정됐습니다.`,
          undefined,
          "STYLE-004",
        );
      }
    }

    const selection = await this.styleSelectionRepository.create(
      input.projectId,
      input.primaryStyleId,
      input.secondaryStyleIds,
      forbiddenStyleIds,
    );

    // "style" 다음 단계는 유형에 따라 갈린다: 브랜딩 & 로고는 브랜드 전략으로,
    // 그 외 유형은 곧바로 이미지 생성으로 -- getWorkspaceSteps()가 알아서
    // 올바른 목록을 골라주므로 여기서 별도 분기 코드는 필요 없다.
    const steps = getWorkspaceSteps(project.deliverableType);
    const stepIndex = steps.findIndex((s) => s.key === "style");
    const nextStep = steps[stepIndex + 1];
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
