import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { MockupTemplateRepository } from "@/modules/mockups/domain/MockupTemplateRepository";
import type { StandaloneMockupRepository } from "@/modules/mockups/domain/StandaloneMockupRepository";
import type { StandaloneMockup } from "@/modules/mockups/domain/StandaloneMockup";
import type { CheckPlanUseCase } from "@/modules/subscriptions/application/CheckPlanUseCase";
import type { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import type { MockupRenderProvider } from "@/shared/ai/MockupRenderProvider";
import type { FileStorage } from "@/shared/storage/FileStorage";
import type { UserRole } from "@/shared/auth/jwt";
import { GENERATION_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";
import { MAX_LOGO_SIZE_BYTES, isAllowedLogoContentType } from "@/modules/projectLogos/domain/projectLogoRules";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, UsageLimitError, ValidationError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logging/logger";

export type StandaloneMockupSource =
  | { type: "upload"; data: Buffer; contentType: string }
  | { type: "past_generation"; imageUrl: string };

export interface CreateStandaloneMockupInput {
  userId: string;
  templateId: string;
  source: StandaloneMockupSource;
  userRole?: UserRole;
}

/**
 * "목업" 단독 프로세스(내 프로젝트의 "새 프로젝트" 마법사와 완전히 별개) --
 * 브랜드 인터뷰/스타일/전략 없이 배경 템플릿 선택 + 로고 첨부만으로 바로
 * 합성한다. GenerateFromLogoAssetUseCase와 동일하게 동기 렌더링, 항상
 * compositingMode "logo"(로고 마크 하나만 합성 -- fullDesign은 "이미 완성된
 * 지면"을 다룰 때만 쓴다). usageLog는 projectId를 요구하므로, 실제 새
 * 프로젝트 마법사를 거치지 않는 얕은 껍데기 Project를 하나 만들어 붙인다
 * (isStandaloneMockup=true라 "내 프로젝트" 목록에는 안 보인다).
 */
export class CreateStandaloneMockupUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly templateRepository: MockupTemplateRepository,
    private readonly standaloneMockupRepository: StandaloneMockupRepository,
    private readonly fileStorage: FileStorage,
    private readonly mockupRenderProvider: MockupRenderProvider,
    private readonly checkPlanUseCase: CheckPlanUseCase,
    private readonly recordUsageUseCase: RecordUsageUseCase,
  ) {}

  async execute(input: CreateStandaloneMockupInput): Promise<StandaloneMockup> {
    const template = await this.templateRepository.findById(input.templateId);
    if (!template) {
      throw new NotFoundError("템플릿을 찾을 수 없습니다.", "MOCKUP_TEMPLATE_NOT_FOUND");
    }

    const plan = await this.checkPlanUseCase.execute({
      userId: input.userId,
      eventType: GENERATION_EVENT_TYPE,
      userRole: input.userRole,
    });
    if (!plan.allowed) {
      throw new UsageLimitError(
        `이번 달 이미지 생성 한도(${plan.limit}회)를 모두 사용했습니다. (${plan.used}/${plan.limit})`,
      );
    }

    let logoImageUrl: string;
    if (input.source.type === "upload") {
      const { data, contentType } = input.source;
      if (!isAllowedLogoContentType(contentType)) {
        throw new ValidationError("PNG 또는 JPEG 이미지만 업로드할 수 있습니다.", undefined, "STANDALONE_MOCKUP-001");
      }
      if (data.byteLength > MAX_LOGO_SIZE_BYTES) {
        throw new ValidationError("이미지 용량은 5MB를 초과할 수 없습니다.", undefined, "STANDALONE_MOCKUP-002");
      }
      // 합성엔 방금 받은 버퍼를 바로 쓰고, 저장은 감사/재사용 목적의
      // 부가 기록일 뿐이라 결과를 기다리지 않는다(await 생략 아님 -- 저장
      // 실패가 합성 자체를 막으면 안 되므로 별도 처리 없이 fire-and-forget).
      this.fileStorage
        .save(`mockup-logos/${input.userId}/${crypto.randomUUID()}`, data, contentType)
        .catch((err) => logger.error("standalone mockup: logo upload archival failed", { err }));
      logoImageUrl = `data:${contentType};base64,${data.toString("base64")}`;
    } else {
      logoImageUrl = input.source.imageUrl;
    }

    const project = {
      id: crypto.randomUUID(),
      userId: input.userId,
      name: `목업 - ${template.name}`,
      status: "completed",
      deliverableType: null,
      currentStep: "mockup",
      isFavorite: false,
      sharedWithTeam: false,
      isStandaloneMockup: true,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.projectRepository.save(project);

    try {
      const result = await this.mockupRenderProvider.render({
        logoImageUrl,
        backgroundUrl: template.backgroundUrl,
        placementArea: template.placementArea,
        templateName: template.name,
        category: template.category,
        compositingMode: "logo",
        isStandalone: true,
      });

      await this.recordUsageUseCase.execute({
        userId: input.userId,
        projectId: project.id,
        eventType: GENERATION_EVENT_TYPE,
        quantity: 1,
        costAmount: result.costAmount,
      });

      const mockup = await this.standaloneMockupRepository.create({
        userId: input.userId,
        projectId: project.id,
        templateId: template.id,
        sourceType: input.source.type,
        status: "completed",
        resultImageUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        provider: result.provider,
        costAmount: result.costAmount,
      });

      await recordActivity({
        userId: input.userId,
        projectId: project.id,
        eventType: "STANDALONE_MOCKUP_CREATED",
        payload: { mockupId: mockup.id, templateId: template.id, sourceType: input.source.type },
      });

      return mockup;
    } catch (err) {
      await this.standaloneMockupRepository.create({
        userId: input.userId,
        projectId: project.id,
        templateId: template.id,
        sourceType: input.source.type,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }
}
