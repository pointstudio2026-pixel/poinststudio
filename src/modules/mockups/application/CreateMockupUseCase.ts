import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { CheckPlanUseCase } from "@/modules/subscriptions/application/CheckPlanUseCase";
import type { MockupRepository } from "@/modules/mockups/domain/MockupRepository";
import type { MockupTemplateRepository } from "@/modules/mockups/domain/MockupTemplateRepository";
import type { MockupRenderQueuePort } from "@/modules/mockups/domain/MockupRenderQueuePort";
import type { MockupProject } from "@/modules/mockups/domain/Mockup";
import type { UserRole } from "@/shared/auth/jwt";
import { GENERATION_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";
import { recordActivity } from "@/shared/activity/activityLogger";
import { ConflictError, NotFoundError, UsageLimitError, ValidationError } from "@/shared/errors/AppError";

export class CreateMockupUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly generationRepository: GenerationRepository,
    private readonly templateRepository: MockupTemplateRepository,
    private readonly checkPlanUseCase: CheckPlanUseCase,
    private readonly mockupRepository: MockupRepository,
    private readonly queue: MockupRenderQueuePort,
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
    generationVersionId: string;
    sourceImageIndex: number;
    templateId: string;
    userRole?: UserRole;
  }): Promise<MockupProject> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const generation = await this.generationRepository.findByProjectId(input.projectId);
    const sourceVersion = await this.generationRepository.getVersionById(input.generationVersionId);
    if (!generation || !sourceVersion || sourceVersion.generationId !== generation.id) {
      throw new NotFoundError("적용할 로고 이미지를 찾을 수 없습니다.", "GENERATION_NOT_FOUND");
    }
    if (sourceVersion.status !== "completed") {
      throw new ConflictError("완료된 생성 결과만 목업에 적용할 수 있습니다.", "MOCKUP-001");
    }
    if (input.sourceImageIndex < 0 || input.sourceImageIndex >= sourceVersion.images.length) {
      throw new ValidationError("존재하지 않는 이미지입니다.", { sourceImageIndex: input.sourceImageIndex });
    }

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

    const mockup = await this.mockupRepository.create({
      projectId: input.projectId,
      generationVersionId: input.generationVersionId,
      sourceImageIndex: input.sourceImageIndex,
      templateId: input.templateId,
    });

    await this.queue.enqueue({ mockupId: mockup.id, requestedByUserId: input.userId });

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "MOCKUP_REQUESTED",
      payload: { mockupId: mockup.id, templateId: input.templateId },
    });

    return mockup;
  }
}
