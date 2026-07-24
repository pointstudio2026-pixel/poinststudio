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
import type { TrainingExampleRepository } from "@/modules/trainingExamples/domain/TrainingExampleRepository";
import { TRAINING_EXAMPLE_CATEGORY_IMAGE_GENERATION } from "@/modules/trainingExamples/domain/TrainingExample";
import { rankTrainingExamples } from "@/modules/trainingExamples/domain/trainingExampleRules";
import { buildPromptLayers, composePrompt } from "@/modules/prompts/domain/promptBuilder";
import { computePromptHash } from "@/modules/prompts/domain/promptHash";
import { DEFAULT_PROVIDER, formatForProvider } from "@/modules/prompts/domain/providerFormatters";
import { resolveSizePreset } from "@/modules/prompts/domain/sizePresetRules";
import { isBrandingDeliverableType } from "@/modules/projects/domain/deliverableTypes";
import { buildDeliverableContextText } from "@/modules/interviews/domain/deliverableTypeQuestions";
import { classifyInterviewInput } from "@/modules/promptPriority/domain/classifyInterviewInput";
import {
  detectDbConflicts,
  detectInternalOverlap,
  type ConflictResult,
  type DbSuggestion,
} from "@/modules/promptPriority/domain/conflictDetection";
import { preserveGoal } from "@/modules/promptPriority/domain/goalPreservationRules";
import { checkPromptCompliance } from "@/modules/promptPriority/domain/promptComplianceCheck";
import { REFERENCE_PROMOTION_THRESHOLD } from "@/modules/promptPriority/domain/generationUsageScore";
import type { PromptDecisionRecordRepository } from "@/modules/promptPriority/domain/PromptDecisionRecordRepository";
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
    private readonly trainingExampleRepository: TrainingExampleRepository,
    private readonly promptDecisionRecordRepository: PromptDecisionRecordRepository,
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
    let forbiddenLogoCategoryNames: string[] = [];

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
      if (logoStyleSelection.forbiddenCategoryIds.length > 0) {
        const forbiddenCategories = await this.logoStyleCategoryRepository.findByIds(
          logoStyleSelection.forbiddenCategoryIds,
        );
        forbiddenLogoCategoryNames = forbiddenCategories.map((c) => c.name);
      }
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

    // 하드 제약조건 분류 -- 인터뷰 답변 + 이미 로드한 각 선택의 forbidden*
    // 필드를 합쳐 만든다. AI 호출 없음.
    const forbiddenStyleNames = selection.forbiddenStyleIds.length
      ? (await this.styleRepository.findByIds(selection.forbiddenStyleIds)).map((s) => s.name)
      : [];
    const { hardConstraints, softPreferences } = classifyInterviewInput({
      answers,
      deliverableType: project.deliverableType,
      colorPaletteSwatches: colorPaletteSelection?.swatches,
      forbiddenColors: colorPaletteSelection?.forbiddenColors,
      forbiddenStyleNames,
      forbiddenLogoCategoryNames,
    });

    // 관리자가 등록한 학습 자료(TrainingExample) 중 이 프로젝트와 같은
    // deliverableType이면서 업종/목적 텍스트가 겹치는 것을 참고 문구로
    // 반영한다 -- AI 호출 없는 결정론적 매칭이라 비용이 들지 않고, 매칭되는
    // 게 없으면(신규 기능이라 데이터가 아직 없을 수 있음) 조용히 생략된다
    // ("내 스타일" userStyleDescription과 동일한 무해한 폴백 패턴). 사용자
    // 하드제약과 충돌하는 후보는 최종 후보에서 제외한다 -- DB는 참고자료일
    // 뿐 사용자의 명시적 결정을 절대 덮어쓰지 않는다.
    let referenceExamplePrompts: string[] = [];
    let avoidPatternPrompts: string[] = [];
    let dbCandidatesFound: string[] = [];
    let dbCandidatesUsed: string[] = [];
    const dbConflicts: ConflictResult[] = [];
    if (project.deliverableType) {
      const deliverableType = project.deliverableType;
      // 데이터가 아무리 쌓여도(수만 건) 조회 비용이 항상 일정하게 유지되도록
      // DB 레벨에서 상위 N개까지만 가져온다 -- 실제 관련성 순위는 그 안에서
      // rankTrainingExamples(키워드 겹침)로 다시 매긴다.
      const CANDIDATE_FETCH_LIMIT = 50;
      const keywordText = [answers.industry, answers.purpose, brandStrategyData.brandKnowledge.mission]
        .filter(Boolean)
        .join(" ");

      const candidates = await this.trainingExampleRepository.listCandidates({
        deliverableType,
        category: TRAINING_EXAMPLE_CATEGORY_IMAGE_GENERATION,
        industry: answers.industry,
        bucket: "above",
        threshold: REFERENCE_PROMOTION_THRESHOLD,
        limit: CANDIDATE_FETCH_LIMIT,
      });
      dbCandidatesFound = candidates.map((c) => c.id);

      const dbSuggestions: DbSuggestion[] = candidates.flatMap((c) => [
        { field: "color" as const, category: "COLOR_CONFLICT" as const, sourceRef: c.id, text: c.prompt, reason: c.prompt },
        { field: "style" as const, category: "STYLE_CONFLICT" as const, sourceRef: c.id, text: c.prompt, reason: c.prompt },
      ]);
      dbConflicts.push(...detectDbConflicts(hardConstraints, dbSuggestions, preserveGoal));
      const excludedCandidateIds = new Set(dbConflicts.map((c) => c.sourceRef));
      const nonConflictingCandidates = candidates.filter((c) => !excludedCandidateIds.has(c.id));

      const ranked = rankTrainingExamples(nonConflictingCandidates, {
        keywordText,
        deliverableType,
        industry: answers.industry,
      })
        .filter((r) => r.score > 0)
        .slice(0, 2);
      referenceExamplePrompts = ranked.map((r) => r.example.prompt);
      dbCandidatesUsed = ranked.map((r) => r.example.id);

      // 회피 지침: 평가 점수 60점 미만인 과거 생성물 중 매칭되는 것(있으면
      // 최대 1개) -- 사용자 지시(2026-07-24), "이런 방향은 피하라".
      const avoidCandidates = await this.trainingExampleRepository.listCandidates({
        deliverableType,
        category: TRAINING_EXAMPLE_CATEGORY_IMAGE_GENERATION,
        industry: answers.industry,
        bucket: "below",
        threshold: REFERENCE_PROMOTION_THRESHOLD,
        limit: CANDIDATE_FETCH_LIMIT,
      });
      const avoidRanked = rankTrainingExamples(avoidCandidates, { keywordText, deliverableType, industry: answers.industry })
        .filter((r) => r.score > 0)
        .slice(0, 1);
      avoidPatternPrompts = avoidRanked.map((r) => r.example.prompt);
    }
    const conflicts = [...dbConflicts, ...detectInternalOverlap(hardConstraints)];

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
      referenceExamplePrompts,
      avoidPatternPrompts,
      colorPaletteSwatches: colorPaletteSelection?.swatches,
      additionalNotes: answers.additionalNotes,
      hardConstraints,
    });
    const { systemPrompt, userPrompt, flaggedTerms, contentOnlyUserPrompt } = composePrompt(layers);
    const complianceCheck = checkPromptCompliance(contentOnlyUserPrompt, hardConstraints);

    const provider = input.provider ?? DEFAULT_PROVIDER;
    const hash = computePromptHash(systemPrompt, userPrompt, provider);
    const sizePreset = resolveSizePreset(project.deliverableType, answers);
    const payload = formatForProvider(provider, systemPrompt, userPrompt, sizePreset);

    const versionInput = { provider, systemPrompt, userPrompt, hash, payload, flaggedTerms };
    const existing = await this.promptRepository.findByProjectId(input.projectId);
    const prompt = existing
      ? await this.promptRepository.addVersion(existing.id, versionInput)
      : await this.promptRepository.createWithFirstVersion(input.projectId, versionInput);

    await this.promptDecisionRecordRepository.create({
      promptVersionId: prompt.currentVersion.id,
      hardConstraints,
      softPreferences,
      dbCandidatesFound,
      dbCandidatesUsed,
      conflicts,
      complianceCheck,
    });

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "PROMPT_BUILT",
      payload: { version: prompt.currentVersion.versionNumber, provider, hash },
    });

    if (conflicts.length > 0) {
      await recordActivity({
        userId: input.userId,
        projectId: input.projectId,
        eventType: "PROMPT_CONFLICT_DETECTED",
        payload: { promptVersionId: prompt.currentVersion.id, conflicts },
      });
    }

    return prompt;
  }
}
