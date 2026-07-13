import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { BrandBriefRepository } from "@/modules/brandBriefs/domain/BrandBriefRepository";
import type { BrandStrategyRepository } from "@/modules/brandStrategies/domain/BrandStrategyRepository";
import type { StyleRepository } from "@/modules/styles/domain/StyleRepository";
import type { StyleSelectionRepository } from "@/modules/styles/domain/StyleSelectionRepository";
import type { PromptRepository } from "@/modules/prompts/domain/PromptRepository";
import type { Prompt, PromptProvider } from "@/modules/prompts/domain/Prompt";
import { buildPromptLayers, composePrompt } from "@/modules/prompts/domain/promptBuilder";
import { computePromptHash } from "@/modules/prompts/domain/promptHash";
import { DEFAULT_PROVIDER, formatForProvider } from "@/modules/prompts/domain/providerFormatters";
import { recordActivity } from "@/shared/activity/activityLogger";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";

export class BuildPromptUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly brandBriefRepository: BrandBriefRepository,
    private readonly brandStrategyRepository: BrandStrategyRepository,
    private readonly styleRepository: StyleRepository,
    private readonly styleSelectionRepository: StyleSelectionRepository,
    private readonly promptRepository: PromptRepository,
  ) {}

  async execute(input: { projectId: string; userId: string; provider?: PromptProvider }): Promise<Prompt> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    // PROMPT-001 Invalid Input: Prompt Engine은 Brand Brief, Brand Strategy,
    // 선택된 Style이 모두 있어야 프롬프트를 생성할 수 있다.
    const brief = await this.brandBriefRepository.findByProjectId(input.projectId);
    const strategy = await this.brandStrategyRepository.findByProjectId(input.projectId);
    const selection = await this.styleSelectionRepository.findLatestByProjectId(input.projectId);
    if (!brief || !strategy || !selection) {
      throw new ConflictError(
        "Brand Brief, Brand Strategy, 스타일 선택이 모두 완료되어야 프롬프트를 생성할 수 있습니다.",
        "PROMPT-001",
      );
    }

    const primaryStyle = await this.styleRepository.findById(selection.primaryStyleId);
    if (!primaryStyle) {
      throw new NotFoundError("선택된 스타일을 찾을 수 없습니다.", "STYLE-003");
    }
    const secondaryStyles = await this.styleRepository.findByIds(selection.secondaryStyleIds);

    const layers = buildPromptLayers({
      brief: brief.currentVersion.data,
      strategy: strategy.currentVersion.data.brandStrategy,
      primaryStyle,
      secondaryStyles,
    });
    const { systemPrompt, userPrompt, flaggedTerms } = composePrompt(layers);

    const provider = input.provider ?? DEFAULT_PROVIDER;
    const hash = computePromptHash(systemPrompt, userPrompt, provider);
    const payload = formatForProvider(provider, systemPrompt, userPrompt);

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
