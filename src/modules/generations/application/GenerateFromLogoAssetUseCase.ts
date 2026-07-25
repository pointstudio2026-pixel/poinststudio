import type { Project } from "@/modules/projects/domain/Project";
import type { ProjectLogoAsset } from "@/modules/projectLogos/domain/ProjectLogoAsset";
import type { MockupTemplateRepository } from "@/modules/mockups/domain/MockupTemplateRepository";
import { DELIVERABLE_TYPE_TO_MOCKUP_CATEGORY } from "@/modules/mockups/domain/mockupRules";
import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";
import type { StyleSelectionRepository } from "@/modules/styles/domain/StyleSelectionRepository";
import type { StyleRepository } from "@/modules/styles/domain/StyleRepository";
import { STYLE_CATEGORY_TEMPLATES } from "@/modules/prompts/domain/promptBuilder";
import type { MockupRenderProvider } from "@/shared/ai/MockupRenderProvider";
import type { ImageGenerationResult } from "@/shared/ai/ImageGenerationProvider";
import type { FileStorage } from "@/shared/storage/FileStorage";
import { InternalError } from "@/shared/errors/AppError";

/**
 * "이미지 생성" 단계에서 AI가 텍스트만으로 로고를 상상해 그리는 대신, 사용자가
 * 첨부한 실제 로고를 그대로 목업 카테고리 배경 템플릿에 합성한다. 브랜딩 &
 * 로고 전용 목업 스튜디오(Mockup/CreateMockupUseCase)는 전혀 건드리지 않고,
 * 이미 그 스튜디오가 쓰는 provider 레벨 합성 로직(OpenAIMockupRenderProvider)만
 * 재사용한다. ProcessGenerationJobUseCase가 "이 프로젝트에 첨부된 로고가
 * 있는가"만 확인해서 이 유스케이스로 분기하고, 반환값은 일반 이미지 생성과
 * 동일한 {images, provider, costAmount} 형태라 나머지 파이프라인(Vision 평가,
 * 사용량 기록, currentStep 전진, 최종 완료 처리)은 전혀 손대지 않는다.
 */
export class GenerateFromLogoAssetUseCase {
  constructor(
    private readonly fileStorage: FileStorage,
    private readonly templateRepository: MockupTemplateRepository,
    private readonly interviewRepository: InterviewRepository,
    private readonly styleSelectionRepository: StyleSelectionRepository,
    private readonly styleRepository: StyleRepository,
    private readonly mockupRenderProvider: MockupRenderProvider,
  ) {}

  async execute(input: { project: Project; logoAsset: ProjectLogoAsset }): Promise<ImageGenerationResult> {
    const { project, logoAsset } = input;

    const category = project.deliverableType
      ? DELIVERABLE_TYPE_TO_MOCKUP_CATEGORY[project.deliverableType]
      : undefined;
    if (!category) {
      throw new InternalError(`"${project.deliverableType}" 유형에 대응하는 목업 카테고리를 찾을 수 없습니다.`);
    }

    const templates = await this.templateRepository.list(category);
    if (templates.length === 0) {
      throw new InternalError(`"${category}" 카테고리에 등록된 목업 템플릿이 없습니다.`);
    }
    // 재시도(다시 생성)마다 다른 연출이 나오도록 무작위로 고른다 -- 카테고리
    // 자체가 이미 업종/작업물유형에 맞게 고정돼 있으므로 같은 카테고리 안에서는
    // 어떤 템플릿을 골라도 안전하다.
    const template = templates[Math.floor(Math.random() * templates.length)]!;

    const interview = await this.interviewRepository.findLatestByProjectId(project.id);
    const industry = interview?.answers.find((a) => a.questionKey === "industry")?.answer ?? undefined;

    const file = await this.fileStorage.read(logoAsset.storageKey);
    if (!file) {
      throw new InternalError("첨부된 로고 파일을 찾을 수 없습니다.");
    }
    const logoDataUri = `data:${file.contentType};base64,${file.data.toString("base64")}`;

    const styleSelection = await this.styleSelectionRepository.findLatestByProjectId(project.id);
    const primaryStyle = styleSelection ? await this.styleRepository.findById(styleSelection.primaryStyleId) : null;
    const styleCategory = primaryStyle ? STYLE_CATEGORY_TEMPLATES[primaryStyle.category] : undefined;

    // 사용자가 첨부한 건 완성된 지면 전체가 아니라 로고 마크 하나뿐이므로
    // "logo" 모드를 쓴다(ProcessMockupJobUseCase가 브랜딩 & 로고 프로젝트에
    // 쓰는 것과 같은 모드) -- fullDesign 모드를 쓰면 "이 이미지가 이미 완성된
    // 디자인이니 그대로 유지하라"는 프롬프트가 되어, 로고 하나만 담긴 이미지를
    // 모델이 "미완성 스케치"로 오해하고 새로 다시 그려버리는 원인이 된다.
    const result = await this.mockupRenderProvider.render({
      logoImageUrl: logoDataUri,
      backgroundUrl: template.backgroundUrl,
      placementArea: template.placementArea,
      templateName: template.name,
      category,
      industry,
      compositingMode: "logo",
      styleCategory,
    });

    return {
      images: [{ url: result.imageUrl, thumbnailUrl: result.thumbnailUrl }],
      provider: result.provider,
      model: "mockup-composite",
      costAmount: result.costAmount,
    };
  }
}
