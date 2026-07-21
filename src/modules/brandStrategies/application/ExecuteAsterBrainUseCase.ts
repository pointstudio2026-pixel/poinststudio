import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";
import type { StyleSelectionRepository } from "@/modules/styles/domain/StyleSelectionRepository";
import type { BrandStrategyRepository } from "@/modules/brandStrategies/domain/BrandStrategyRepository";
import type { BrandStrategy, BrandStrategyData } from "@/modules/brandStrategies/domain/BrandStrategy";
import type { AsterBrainComposer } from "@/modules/brandStrategies/application/AsterBrainComposer";
import type { ColorPaletteSelectionRepository } from "@/modules/colorPalettes/domain/ColorPaletteSelectionRepository";
import type { ColorSwatch } from "@/modules/colorPalettes/domain/ColorPalette";
import { recordActivity } from "@/shared/activity/activityLogger";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";

export type ExecuteAsterBrainMode = "execute" | "rebuild";

/**
 * 스타일 단계에서 사용자가 실제로 컬러를 골랐다면 그 선택이 규칙 기반
 * 추천 문구("브랜드 톤에 맞는 중성 계열 컬러" 등)보다 항상 우선해서
 * 화면에 보여야 한다 -- 사용자가 안 골랐을 때만 규칙 기반 값을 그대로
 * 둔다. 실제 이미지 생성 프롬프트(BuildPromptUseCase/promptBuilder.ts)는
 * 이미 스타일 단계 선택만 사용하고 있어 변경하지 않는다 -- 여기는 순전히
 * Brand Strategy 화면 표시용 오버라이드.
 */
function overrideRecommendedColorsWithUserSelection(
  candidates: BrandStrategyData[],
  swatches: ColorSwatch[],
): BrandStrategyData[] {
  return candidates.map((candidate) => ({
    ...candidate,
    brandStrategy: {
      ...candidate.brandStrategy,
      recommendedColors: [
        {
          value: swatches.map((s) => `${s.label}(${s.hex})`).join(", "),
          reason: "스타일 단계에서 직접 선택한 브랜드 컬러입니다.",
        },
      ],
    },
  }));
}

export class ExecuteAsterBrainUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly interviewRepository: InterviewRepository,
    private readonly styleSelectionRepository: StyleSelectionRepository,
    private readonly brandStrategyRepository: BrandStrategyRepository,
    private readonly composer: AsterBrainComposer,
    private readonly colorPaletteSelectionRepository: ColorPaletteSelectionRepository,
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
    mode: ExecuteAsterBrainMode;
    provider?: string;
  }): Promise<BrandStrategy> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const interview = await this.interviewRepository.findLatestByProjectId(input.projectId);
    if (!interview || interview.status !== "completed") {
      throw new ConflictError(
        "Brand Interview를 먼저 완료해야 Aster Brain 분석을 실행할 수 있습니다.",
        "INTERVIEW_NOT_COMPLETED",
      );
    }

    const styleSelection = await this.styleSelectionRepository.findLatestByProjectId(input.projectId);
    if (!styleSelection) {
      throw new ConflictError(
        "스타일을 먼저 선택해야 Aster Brain 분석을 실행할 수 있습니다.",
        "STYLE_SELECTION_REQUIRED",
      );
    }

    const existing = await this.brandStrategyRepository.findByProjectId(input.projectId);
    // "execute"는 최초 실행(또는 이미 있으면 기존 결과 반환)이고, "재분석"은
    // 항상 새 3개 후보 세트를 만드는 "rebuild"로만 수행한다.
    if (existing && input.mode === "execute") {
      return existing;
    }

    const answers = Object.fromEntries(
      interview.answers.filter((a) => a.answer).map((a) => [a.questionKey, a.answer as string]),
    );

    const { candidates: rawCandidates, reasoningSummary, confidenceLevel } = await this.composer.compose(
      answers,
      input.provider,
    );

    const colorSelection = await this.colorPaletteSelectionRepository.findLatestByProjectId(input.projectId);
    const candidates = colorSelection
      ? overrideRecommendedColorsWithUserSelection(rawCandidates, colorSelection.swatches)
      : rawCandidates;

    const strategy = existing
      ? await this.brandStrategyRepository.addVersion(existing.id, candidates, reasoningSummary, confidenceLevel)
      : await this.brandStrategyRepository.createWithFirstVersion(
          input.projectId,
          candidates,
          reasoningSummary,
          confidenceLevel,
        );

    // currentStep 전진은 여기서 하지 않는다 -- 사용자가 3개 후보 중 하나를
    // 선택(SelectBrandStrategyUseCase)해야 다음 단계로 넘어간다.

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: input.mode === "rebuild" ? "BRAND_STRATEGY_REBUILT" : "BRAND_STRATEGY_GENERATED",
      payload: { version: strategy.currentVersion.versionNumber, confidence: confidenceLevel },
    });

    return strategy;
  }
}
