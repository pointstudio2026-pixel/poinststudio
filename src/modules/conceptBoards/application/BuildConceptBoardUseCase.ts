import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";
import type { BrandStrategyRepository } from "@/modules/brandStrategies/domain/BrandStrategyRepository";
import type { BrandStrategyData } from "@/modules/brandStrategies/domain/BrandStrategy";
import { buildFallbackBrandStrategyData } from "@/modules/brandStrategies/domain/asterBrainRules";
import type { StyleRepository } from "@/modules/styles/domain/StyleRepository";
import type { StyleSelectionRepository } from "@/modules/styles/domain/StyleSelectionRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { GeneratedImage } from "@/modules/generations/domain/Generation";
import type { ConceptBoardRepository } from "@/modules/conceptBoards/domain/ConceptBoardRepository";
import type { ConceptBoard } from "@/modules/conceptBoards/domain/ConceptBoard";
import type { ColorPaletteSelectionRepository } from "@/modules/colorPalettes/domain/ColorPaletteSelectionRepository";
import { composeConceptBoardData } from "@/modules/conceptBoards/domain/conceptBoardComposer";
import { extractDominantColors } from "@/modules/conceptBoards/infrastructure/dominantColorExtractor";
import { getWorkspaceSteps } from "@/modules/projects/domain/Project";
import { isBrandingDeliverableType } from "@/modules/projects/domain/deliverableTypes";
import { recordActivity } from "@/shared/activity/activityLogger";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";

export class BuildConceptBoardUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly interviewRepository: InterviewRepository,
    private readonly brandStrategyRepository: BrandStrategyRepository,
    private readonly styleRepository: StyleRepository,
    private readonly styleSelectionRepository: StyleSelectionRepository,
    private readonly generationRepository: GenerationRepository,
    private readonly colorPaletteSelectionRepository: ColorPaletteSelectionRepository,
    private readonly conceptBoardRepository: ConceptBoardRepository,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<ConceptBoard> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const interview = await this.interviewRepository.findLatestByProjectId(input.projectId);
    if (!interview || interview.status !== "completed") {
      throw new ConflictError(
        "Brand Interview가 완료되어야 Concept Board를 생성할 수 있습니다.",
        "CONCEPT_BOARD_PREREQUISITES_MISSING",
      );
    }

    const answers = Object.fromEntries(
      interview.answers.filter((a) => a.answer).map((a) => [a.questionKey, a.answer as string]),
    );

    // "브랜딩 & 로고"(레거시 null 포함)는 선택된 Brand Strategy를 요구하지만,
    // 그 외 유형은 Brand Strategy 단계 자체가 없으므로 즉석 결정론적
    // 폴백 데이터를 대신 쓴다 (BuildPromptUseCase와 동일한 패턴).
    let strategyData: BrandStrategyData;
    if (isBrandingDeliverableType(project.deliverableType)) {
      const strategy = await this.brandStrategyRepository.findByProjectId(input.projectId);
      if (!strategy || strategy.currentVersion.selectedIndex === null) {
        throw new ConflictError(
          "Brand Strategy 선택이 완료되어야 Concept Board를 생성할 수 있습니다.",
          "CONCEPT_BOARD_PREREQUISITES_MISSING",
        );
      }
      strategyData = strategy.currentVersion.data;
    } else {
      strategyData = buildFallbackBrandStrategyData(answers);
    }

    const selection = await this.styleSelectionRepository.findLatestByProjectId(input.projectId);
    const primaryStyle = selection ? await this.styleRepository.findById(selection.primaryStyleId) : null;
    const secondaryStyles = selection ? await this.styleRepository.findByIds(selection.secondaryStyleIds) : [];

    // "이미지 없음": 아직 생성된 이미지가 없어도 Brand Strategy만으로
    // 방향성 텍스트 섹션은 채울 수 있으므로 생성 결과는 선택 사항이다.
    // 이미지 생성이 버전당 1장으로 줄어든 대신 프로젝트당 최대 3개의 버전이
    // 누적되므로(resultCap.ts), 완료된 버전 전체에서 이미지를 모아 "로고
    // 컨셉" 섹션이 계속 여러 장을 보여줄 수 있게 한다.
    const generation = await this.generationRepository.findByProjectId(input.projectId);
    let latestGenerationImages: GeneratedImage[] | null = null;
    if (generation) {
      const versions = await this.generationRepository.listVersions(generation.id);
      const images = versions
        .filter((v) => v.status === "completed")
        .sort((a, b) => a.versionNumber - b.versionNumber)
        .flatMap((v) => v.images);
      latestGenerationImages = images.length > 0 ? images : null;
    }

    // 컬러 팔레트 정확도: (1) 사용자가 스타일 화면에서 미리 고른 팔레트가
    // 있으면 최우선(실제 프롬프트와 100% 일치), (2) 없으면 실제 생성된
    // 히어로 이미지에서 지배색을 추출(AI 호출 없음), (3) 둘 다 없으면
    // composeConceptBoardData 내부의 기존 키워드 추측 로직으로 폴백.
    const colorPaletteSelection = await this.colorPaletteSelectionRepository.findLatestByProjectId(
      input.projectId,
    );
    const extractedColorPalette =
      !colorPaletteSelection && latestGenerationImages?.[0]
        ? await extractDominantColors(latestGenerationImages[0].url)
        : null;

    const data = composeConceptBoardData({
      answers,
      strategy: strategyData,
      primaryStyle,
      secondaryStyles,
      latestGenerationImages,
      selectedColorPalette: colorPaletteSelection?.swatches ?? null,
      extractedColorPalette,
    });

    const existing = await this.conceptBoardRepository.findByProjectId(input.projectId);
    const board = existing
      ? await this.conceptBoardRepository.addVersion(existing.id, data, "ai")
      : await this.conceptBoardRepository.createWithFirstVersion(input.projectId, data, "ai");

    const steps = getWorkspaceSteps(project.deliverableType);
    const stepIndex = steps.findIndex((s) => s.key === "concept_board");
    const nextStep = steps[stepIndex + 1];
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
