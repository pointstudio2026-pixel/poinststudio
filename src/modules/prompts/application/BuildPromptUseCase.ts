import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";
import type { BrandStrategyRepository } from "@/modules/brandStrategies/domain/BrandStrategyRepository";
import type { BrandStrategyData } from "@/modules/brandStrategies/domain/BrandStrategy";
import { buildFallbackBrandStrategyData } from "@/modules/brandStrategies/domain/asterBrainRules";
import type { StyleRepository } from "@/modules/styles/domain/StyleRepository";
import type { StyleSelectionRepository } from "@/modules/styles/domain/StyleSelectionRepository";
import type { LogoStyleCategoryRepository } from "@/modules/logoStyles/domain/LogoStyleCategoryRepository";
import type { LogoStyleSelectionRepository } from "@/modules/logoStyles/domain/LogoStyleSelectionRepository";
import type { UserStyleCategoryRepository } from "@/modules/userStyles/domain/UserStyleCategoryRepository";
import type { ProjectUserStyleSelectionRepository } from "@/modules/userStyles/domain/ProjectUserStyleSelectionRepository";
import type { ColorPaletteSelectionRepository } from "@/modules/colorPalettes/domain/ColorPaletteSelectionRepository";
import type { PromptRepository } from "@/modules/prompts/domain/PromptRepository";
import type { Prompt, PromptProvider } from "@/modules/prompts/domain/Prompt";
import { buildPromptLayers, composePrompt } from "@/modules/prompts/domain/promptBuilder";
import { computePromptHash } from "@/modules/prompts/domain/promptHash";
import { DEFAULT_PROVIDER, formatForProvider } from "@/modules/prompts/domain/providerFormatters";
import { resolveSizePreset } from "@/modules/prompts/domain/sizePresetRules";
import { isBrandingDeliverableType } from "@/modules/projects/domain/deliverableTypes";
import { buildDeliverableContextText } from "@/modules/interviews/domain/deliverableTypeQuestions";
import { recordActivity } from "@/shared/activity/activityLogger";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";

export class BuildPromptUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly interviewRepository: InterviewRepository,
    private readonly brandStrategyRepository: BrandStrategyRepository,
    private readonly styleRepository: StyleRepository,
    private readonly styleSelectionRepository: StyleSelectionRepository,
    private readonly logoStyleCategoryRepository: LogoStyleCategoryRepository,
    private readonly logoStyleSelectionRepository: LogoStyleSelectionRepository,
    private readonly userStyleCategoryRepository: UserStyleCategoryRepository,
    private readonly projectUserStyleSelectionRepository: ProjectUserStyleSelectionRepository,
    private readonly colorPaletteSelectionRepository: ColorPaletteSelectionRepository,
    private readonly promptRepository: PromptRepository,
  ) {}

  async execute(input: { projectId: string; userId: string; provider?: PromptProvider }): Promise<Prompt> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    // PROMPT-001 Invalid Input: 모든 작업물 유형이 완료된 Interview와 선택된
    // Style을 요구한다. "브랜딩 & 로고"(레거시 null 포함)는 선택된 Brand
    // Strategy/로고 스타일도 추가로 요구하지만, 그 외 유형은 애초에 두 단계가
    // 존재하지 않으므로 즉석 결정론적 폴백 데이터를 대신 쓴다.
    const interview = await this.interviewRepository.findLatestByProjectId(input.projectId);
    const selection = await this.styleSelectionRepository.findLatestByProjectId(input.projectId);
    if (!interview || interview.status !== "completed" || !selection) {
      throw new ConflictError(
        "Brand Interview 완료와 스타일 선택이 모두 완료되어야 프롬프트를 생성할 수 있습니다.",
        "PROMPT-001",
      );
    }

    const primaryStyle = await this.styleRepository.findById(selection.primaryStyleId);
    if (!primaryStyle) {
      throw new NotFoundError("선택된 스타일을 찾을 수 없습니다.", "STYLE-003");
    }
    const secondaryStyles = await this.styleRepository.findByIds(selection.secondaryStyleIds);

    const answers = Object.fromEntries(
      interview.answers.filter((a) => a.answer).map((a) => [a.questionKey, a.answer as string]),
    );

    let brandStrategyData: BrandStrategyData;
    let logoStyleNames: string[] = [];

    if (isBrandingDeliverableType(project.deliverableType)) {
      const strategy = await this.brandStrategyRepository.findByProjectId(input.projectId);
      const logoStyleSelection = await this.logoStyleSelectionRepository.findLatestByProjectId(input.projectId);
      if (!strategy || strategy.currentVersion.selectedIndex === null || !logoStyleSelection) {
        throw new ConflictError(
          "Brand Strategy 선택과 로고 스타일 선택이 모두 완료되어야 프롬프트를 생성할 수 있습니다.",
          "PROMPT-001",
        );
      }
      const logoStyleCategories = await this.logoStyleCategoryRepository.findByIds(logoStyleSelection.categoryIds);
      if (logoStyleCategories.length === 0) {
        throw new NotFoundError("선택된 로고 스타일을 찾을 수 없습니다.", "LOGO_STYLE-003");
      }
      brandStrategyData = strategy.currentVersion.data;
      logoStyleNames = logoStyleCategories.map((c) => c.name);
    } else {
      brandStrategyData = buildFallbackBrandStrategyData(answers);
    }

    const deliverableContext = buildDeliverableContextText(project.deliverableType, answers);

    // "내 스타일"은 어떤 워크스페이스 단계도 게이팅하지 않는 선택 사항이라
    // 선택이 없어도(또는 카테고리가 아직 분석되지 않아도) 조용히 생략된다.
    const userStyleSelection = await this.projectUserStyleSelectionRepository.findLatestByProjectId(
      input.projectId,
    );
    const userStyleCategory = userStyleSelection
      ? await this.userStyleCategoryRepository.findById(userStyleSelection.userStyleCategoryId)
      : null;
    const userStyleDescription = userStyleCategory?.description ?? undefined;

    // "브랜드 컬러 선택"도 어떤 워크스페이스 단계도 게이팅하지 않는 선택
    // 사항이라 없으면 조용히 생략된다(내 스타일과 동일한 패턴).
    const colorPaletteSelection = await this.colorPaletteSelectionRepository.findLatestByProjectId(
      input.projectId,
    );

    const layers = buildPromptLayers({
      brandName: answers.brandName ?? "",
      industry: answers.industry ?? "",
      mission: brandStrategyData.brandKnowledge.mission,
      deliverableType: project.deliverableType ?? undefined,
      deliverableContext,
      strategy: brandStrategyData.brandStrategy,
      primaryStyle,
      secondaryStyles,
      logoStyleNames,
      userStyleDescription,
      colorPaletteSwatches: colorPaletteSelection?.swatches,
      additionalNotes: answers.additionalNotes,
    });
    const { systemPrompt, userPrompt, flaggedTerms } = composePrompt(layers);

    const provider = input.provider ?? DEFAULT_PROVIDER;
    const hash = computePromptHash(systemPrompt, userPrompt, provider);
    const sizePreset = resolveSizePreset(project.deliverableType, answers);
    const payload = formatForProvider(provider, systemPrompt, userPrompt, sizePreset);

    const versionInput = { provider, systemPrompt, userPrompt, hash, payload, flaggedTerms };
    const existing = await this.promptRepository.findByProjectId(input.projectId);
    const prompt = existing
      ? await this.promptRepository.addVersion(existing.id, versionInput)
      : await this.promptRepository.createWithFirstVersion(input.projectId, versionInput);

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "PROMPT_BUILT",
      payload: { version: prompt.currentVersion.versionNumber, provider, hash },
    });

    return prompt;
  }
}
