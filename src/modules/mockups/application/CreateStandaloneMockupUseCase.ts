import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { MockupTemplateRepository } from "@/modules/mockups/domain/MockupTemplateRepository";
import type { StandaloneMockupRepository } from "@/modules/mockups/domain/StandaloneMockupRepository";
import type { StandaloneMockup } from "@/modules/mockups/domain/StandaloneMockup";
import type { GuestMockupUsageRepository } from "@/modules/mockups/domain/GuestMockupUsageRepository";
import type { CheckPlanUseCase } from "@/modules/subscriptions/application/CheckPlanUseCase";
import type { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import type { CheckGuestMockupLimitUseCase } from "@/modules/mockups/application/CheckGuestMockupLimitUseCase";
import type { MockupRenderProvider } from "@/shared/ai/MockupRenderProvider";
import type { FileStorage } from "@/shared/storage/FileStorage";
import type { UserRole } from "@/shared/auth/jwt";
import { GENERATION_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";
import { GUEST_MOCKUP_LIFETIME_LIMIT, SYSTEM_GUEST_USER_ID } from "@/modules/mockups/domain/guestMockup";
import { MAX_LOGO_SIZE_BYTES, isAllowedLogoContentType } from "@/modules/projectLogos/domain/projectLogoRules";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, UsageLimitError, ValidationError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logging/logger";

export type StandaloneMockupSource =
  | { type: "upload"; data: Buffer; contentType: string }
  | { type: "past_generation"; imageUrl: string };

/**
 * 로그인 유저와 게스트(비로그인)를 판별 유니온으로 구분한다 -- 아래 로직이
 * 실수로 게스트를 실제 유저처럼(또는 그 반대로) 다루지 못하게, 타입
 * 단계에서 막는다.
 */
export type StandaloneMockupCaller =
  | { kind: "user"; userId: string; userRole?: UserRole }
  | { kind: "guest"; guestId: string };

export interface CreateStandaloneMockupInput {
  caller: StandaloneMockupCaller;
  templateId: string;
  source: StandaloneMockupSource;
}

/**
 * "목업" 단독 프로세스(내 프로젝트의 "새 프로젝트" 마법사와 완전히 별개) --
 * 브랜드 인터뷰/스타일/전략 없이 배경 템플릿 선택 + 로고 첨부만으로 바로
 * 합성한다. GenerateFromLogoAssetUseCase와 동일하게 동기 렌더링, 항상
 * compositingMode "logo"(로고 마크 하나만 합성 -- fullDesign은 "이미 완성된
 * 지면"을 다룰 때만 쓴다). usageLog는 projectId를 요구하므로, 실제 새
 * 프로젝트 마법사를 거치지 않는 얕은 껍데기 Project를 하나 만들어 붙인다
 * (isStandaloneMockup=true라 "내 프로젝트" 목록에는 안 보인다).
 *
 * 2026-07-31: 비로그인 게스트도 3회까지 이 흐름을 쓸 수 있게 열었다 --
 * 게스트가 만드는 Project/StandaloneMockup은 고정 시스템 게스트 User
 * (SYSTEM_GUEST_USER_ID)가 FK 소유자로 붙고, 실제 게스트별 3회 제한/
 * 회원가입 시 이전은 GuestMockupUsageRepository가 별도로 추적한다(실제
 * 유저의 checkPlanUseCase/월간 한도와는 완전히 다른 축).
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
    private readonly checkGuestMockupLimitUseCase: CheckGuestMockupLimitUseCase,
    private readonly guestMockupUsageRepository: GuestMockupUsageRepository,
  ) {}

  async execute(input: CreateStandaloneMockupInput): Promise<StandaloneMockup> {
    const template = await this.templateRepository.findById(input.templateId);
    if (!template) {
      throw new NotFoundError("템플릿을 찾을 수 없습니다.", "MOCKUP_TEMPLATE_NOT_FOUND");
    }

    const ownerUserId = input.caller.kind === "user" ? input.caller.userId : SYSTEM_GUEST_USER_ID;

    if (input.caller.kind === "user") {
      const plan = await this.checkPlanUseCase.execute({
        userId: input.caller.userId,
        eventType: GENERATION_EVENT_TYPE,
        userRole: input.caller.userRole,
      });
      if (!plan.allowed) {
        throw new UsageLimitError(
          `이번 달 이미지 생성 한도(${plan.limit}회)를 모두 사용했습니다. (${plan.used}/${plan.limit})`,
        );
      }
    } else {
      const guestPlan = await this.checkGuestMockupLimitUseCase.execute({ guestId: input.caller.guestId });
      if (!guestPlan.allowed) {
        throw new UsageLimitError(
          `게스트로 만들 수 있는 목업은 ${GUEST_MOCKUP_LIFETIME_LIMIT}개까지예요. 회원가입하면 계속 만들 수 있어요.`,
          "GUEST_MOCKUP_LIMIT_REACHED",
        );
      }
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
      const storageOwnerSegment =
        input.caller.kind === "user" ? input.caller.userId : `guest/${input.caller.guestId}`;
      this.fileStorage
        .save(`mockup-logos/${storageOwnerSegment}/${crypto.randomUUID()}`, data, contentType)
        .catch((err) => logger.error("standalone mockup: logo upload archival failed", { err }));
      logoImageUrl = `data:${contentType};base64,${data.toString("base64")}`;
    } else {
      logoImageUrl = input.source.imageUrl;
    }

    const project = {
      id: crypto.randomUUID(),
      userId: ownerUserId,
      // template.name은 관리용 원문 라벨이라 배경 선택 단계에서만 보여야
      // 하는데, 예전엔 여기서 Project.name에 그대로 박아 넣어서 대시보드
      // 카드 제목이나 "과거 이미지에서 선택" 캡션 등 프로젝트 이름이
      // 노출되는 모든 곳에 새어나갔다(2026-07-31 발견). MyWorkView가 이미
      // standalone_mockup 항목을 항상 번역된 일반 라벨("목업")로 보여주고
      // 있어서, 저장하는 이름 자체도 그 관례를 따른다.
      name: "목업",
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
        userId: ownerUserId,
        projectId: project.id,
        eventType: GENERATION_EVENT_TYPE,
        quantity: 1,
        costAmount: result.costAmount,
      });

      const mockup = await this.standaloneMockupRepository.create({
        userId: ownerUserId,
        projectId: project.id,
        templateId: template.id,
        sourceType: input.source.type,
        status: "completed",
        resultImageUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        provider: result.provider,
        costAmount: result.costAmount,
      });

      // 게스트는 성공한 시도만 3회 한도에 카운트한다(실제 유저의
      // checkPlanUseCase가 UsageLog를 성공 시에만 쌓는 것과 동일한
      // 시맨틱) -- 실패 시엔 아래 catch에서 이 호출을 하지 않는다.
      if (input.caller.kind === "guest") {
        await this.guestMockupUsageRepository.create({
          guestId: input.caller.guestId,
          projectId: project.id,
          standaloneMockupId: mockup.id,
        });
      }

      await recordActivity({
        userId: input.caller.kind === "user" ? input.caller.userId : undefined,
        projectId: project.id,
        eventType: "STANDALONE_MOCKUP_CREATED",
        payload: {
          mockupId: mockup.id,
          templateId: template.id,
          sourceType: input.source.type,
          guestId: input.caller.kind === "guest" ? input.caller.guestId : undefined,
        },
      });

      return mockup;
    } catch (err) {
      await this.standaloneMockupRepository.create({
        userId: ownerUserId,
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
