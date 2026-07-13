import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { BrandBriefRepository } from "@/modules/brandBriefs/domain/BrandBriefRepository";
import type { BrandStrategyRepository } from "@/modules/brandStrategies/domain/BrandStrategyRepository";
import type { StyleRepository } from "@/modules/styles/domain/StyleRepository";
import type { StyleSelectionRepository } from "@/modules/styles/domain/StyleSelectionRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { ConceptBoardRepository } from "@/modules/conceptBoards/domain/ConceptBoardRepository";
import type { ConceptBoard } from "@/modules/conceptBoards/domain/ConceptBoard";
import { composeConceptBoardData } from "@/modules/conceptBoards/domain/conceptBoardComposer";
import { WORKSPACE_STEPS } from "@/modules/projects/domain/Project";
import { recordActivity } from "@/shared/activity/activityLogger";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";

export class BuildConceptBoardUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly brandBriefRepository: BrandBriefRepository,
    private readonly brandStrategyRepository: BrandStrategyRepository,
    private readonly styleRepository: StyleRepository,
    private readonly styleSelectionRepository: StyleSelectionRepository,
    private readonly generationRepository: GenerationRepository,
    private readonly conceptBoardRepository: ConceptBoardRepository,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<ConceptBoard> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const brief = await this.brandBriefRepository.findByProjectId(input.projectId);
    const strategy = await this.brandStrategyRepository.findByProjectId(input.projectId);
    if (!brief || !strategy) {
      throw new ConflictError(
        "Brand Brief와 Brand Strategy가 모두 완료되어야 Concept Board를 생성할 수 있습니다.",
        "CONCEPT_BOARD_PREREQUISITES_MISSING",
      );
    }

    const selection = await this.styleSelectionRepository.findLatestByProjectId(input.projectId);
    const primaryStyle = selection ? await this.styleRepository.findById(selection.primaryStyleId) : null;
    const secondaryStyles = selection ? await this.styleRepository.findByIds(selection.secondaryStyleIds) : [];

    // "이미지 없음": 아직 생성된 이미지가 없어도 Brand Brief/Strategy만으로
    // 방향성 텍스트 섹션은 채울 수 있으므로 생성 결과는 선택 사항이다.
    const generation = await this.generationRepository.findByProjectId(input.projectId);
    const latestGenerationImages =
      generation && generation.currentVersion.status === "completed" ? generation.currentVersion.images : null;

    const data = composeConceptBoardData({
      brief: brief.currentVersion.data,
      strategy: strategy.currentVersion.data,
      primaryStyle,
      secondaryStyles,
      latestGenerationImages,
    });

    const existing = await this.conceptBoardRepository.findByProjectId(input.projectId);
    const board = existing
      ? await this.conceptBoardRepository.addVersion(existing.id, data, "ai")
      : await this.conceptBoardRepository.createWithFirstVersion(input.projectId, data, "ai");

    const stepIndex = WORKSPACE_STEPS.findIndex((s) => s.key === "concept_board");
    const nextStep = WORKSPACE_STEPS[stepIndex + 1];
    if (nextStep && project.currentStep === "concept_board") {
      await this.projectRepository.save({ ...project, currentStep: nextStep.key, updatedAt: new Date() });
    }

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "CONCEPT_BOARD_GENERATED",
      payload: { version: board.currentVersion.versionNumber },
    });

    return board;
  }
}
