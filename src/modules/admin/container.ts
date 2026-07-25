import { PrismaAdminRepository } from "@/modules/admin/infrastructure/PrismaAdminRepository";
import { PrismaAnnouncementRepository } from "@/modules/admin/infrastructure/PrismaAnnouncementRepository";
import { GetAdminDashboardUseCase } from "@/modules/admin/application/GetAdminDashboardUseCase";
import { GetAdminAnalyticsUseCase } from "@/modules/admin/application/GetAdminAnalyticsUseCase";
import { SearchAdminUsersUseCase } from "@/modules/admin/application/SearchAdminUsersUseCase";
import { GetAuditLogsUseCase } from "@/modules/admin/application/GetAuditLogsUseCase";
import { GetProviderHealthUseCase } from "@/modules/admin/application/GetProviderHealthUseCase";
import {
  CreateAnnouncementUseCase,
  DeactivateAnnouncementUseCase,
  ListAnnouncementsUseCase,
} from "@/modules/admin/application/AnnouncementUseCases";
import { SuspendUserUseCase } from "@/modules/admin/application/SuspendUserUseCase";
import { UnsuspendUserUseCase } from "@/modules/admin/application/UnsuspendUserUseCase";
import { DeleteUserUseCase } from "@/modules/admin/application/DeleteUserUseCase";
import { ChangeUserRoleUseCase } from "@/modules/admin/application/ChangeUserRoleUseCase";
import { GetUserDetailUseCase } from "@/modules/admin/application/GetUserDetailUseCase";
import { PromoteGenerationsToReferenceUseCase } from "@/modules/promptPriority/application/PromoteGenerationsToReferenceUseCase";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import {
  generationEvaluationRepositoryInstance,
  generationFeedbackRepositoryInstance,
  generationRepositoryInstance,
} from "@/modules/generations/container";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { interviewRepositoryInstance } from "@/modules/interviews/container";
import { promptRepositoryInstance } from "@/modules/prompts/container";
import { promptDecisionRecordRepositoryInstance } from "@/modules/promptPriority/container";
import { trainingExampleRepositoryInstance } from "@/modules/trainingExamples/container";
import { scheduleReferencePromotion } from "@/shared/queue/referencePromotionQueue";
import { startReferencePromotionWorker } from "@/workers/referencePromotionWorker";
import { scheduleGiftCodeExpiry } from "@/shared/queue/giftCodeExpiryQueue";
import { startGiftCodeExpiryWorker } from "@/workers/giftCodeExpiryWorker";
import { RevertExpiredGiftPlansUseCase } from "@/modules/subscriptions/application/RevertExpiredGiftPlansUseCase";
import { giftCodesContainer } from "@/modules/giftCodes/container";
import { resolveTextCompletionProvider } from "@/shared/ai/textCompletionRouter";
import { resolveImageGenerationProvider } from "@/shared/ai/imageGenerationRouter";
import { resolveMockupRenderProvider } from "@/shared/ai/mockupRenderRouter";
import { imageGenerationQueue } from "@/shared/queue/imageGenerationQueue";
import { imageEditQueue } from "@/shared/queue/imageEditQueue";
import { mockupRenderQueue } from "@/shared/queue/mockupRenderQueue";
import { exportQueue } from "@/shared/queue/exportQueue";
import { subscriptionRepository, subscriptionsContainer } from "@/modules/subscriptions/container";

const adminRepository = new PrismaAdminRepository();
const announcementRepository = new PrismaAnnouncementRepository();
// authContainer가 아니라 직접 인스턴스화 -- authContainer는 RegisterUseCase 등
// 이 모듈에 필요 없는 유스케이스까지 줄줄이 끌고 오므로, 상태 없는(stateless)
// 리포지토리 하나만 필요할 땐 직접 만드는 게 더 가볍다(같은 파일의 다른
// *RepositoryInstance들과 달리 auth 모듈은 컨테이너 인스턴스를 export하지 않음).
const userRepository = new PrismaUserRepository();
const textCompletionProvider = resolveTextCompletionProvider();
const imageGenerationProvider = resolveImageGenerationProvider();
const mockupRenderProvider = resolveMockupRenderProvider();
const getAuditLogsUseCase = new GetAuditLogsUseCase(adminRepository);

export const adminContainer = {
  getAdminDashboardUseCase: new GetAdminDashboardUseCase(
    adminRepository,
    textCompletionProvider,
    imageGenerationProvider,
    mockupRenderProvider,
    imageGenerationQueue,
    imageEditQueue,
    mockupRenderQueue,
    exportQueue,
  ),
  getAdminAnalyticsUseCase: new GetAdminAnalyticsUseCase(adminRepository),
  searchAdminUsersUseCase: new SearchAdminUsersUseCase(adminRepository),
  getAuditLogsUseCase,
  getProviderHealthUseCase: new GetProviderHealthUseCase(
    textCompletionProvider,
    imageGenerationProvider,
    mockupRenderProvider,
  ),
  createAnnouncementUseCase: new CreateAnnouncementUseCase(announcementRepository),
  listAnnouncementsUseCase: new ListAnnouncementsUseCase(announcementRepository),
  deactivateAnnouncementUseCase: new DeactivateAnnouncementUseCase(announcementRepository),
  suspendUserUseCase: new SuspendUserUseCase(adminRepository),
  unsuspendUserUseCase: new UnsuspendUserUseCase(adminRepository),
  deleteUserUseCase: new DeleteUserUseCase(adminRepository),
  changeUserRoleUseCase: new ChangeUserRoleUseCase(adminRepository),
  getUserDetailUseCase: new GetUserDetailUseCase(
    adminRepository,
    getAuditLogsUseCase,
    subscriptionsContainer.getUsageSummaryUseCase,
  ),
  promoteGenerationsToReferenceUseCase: new PromoteGenerationsToReferenceUseCase(
    generationEvaluationRepositoryInstance,
    generationRepositoryInstance,
    generationFeedbackRepositoryInstance,
    projectRepositoryInstance,
    interviewRepositoryInstance,
    promptRepositoryInstance,
    promptDecisionRecordRepositoryInstance,
    trainingExampleRepositoryInstance,
    userRepository,
  ),
  generateGiftCodesUseCase: giftCodesContainer.generateGiftCodesUseCase,
  listGiftCodesUseCase: giftCodesContainer.listGiftCodesUseCase,
  revertExpiredGiftPlansUseCase: new RevertExpiredGiftPlansUseCase(subscriptionRepository),
};

// 매일 자동으로 미평가 생성물을 평가+승격한다(관리자 "지금 실행" 버튼과
// 별개로, 항상 자동으로도 돈다). AI 호출 없음, 비용 0 -- 다른 큐/워커와
// 동일한 MVP 모놀리스 자동 시작 패턴.
const globalForReferencePromotionWorker = globalThis as unknown as { referencePromotionWorkerStarted?: boolean };
const isBuildPhaseForReferencePromotion = process.env.npm_lifecycle_event === "build";
if (!isBuildPhaseForReferencePromotion && !globalForReferencePromotionWorker.referencePromotionWorkerStarted) {
  startReferencePromotionWorker(adminContainer.promoteGenerationsToReferenceUseCase);
  void scheduleReferencePromotion();
  globalForReferencePromotionWorker.referencePromotionWorkerStarted = true;
}

// 매일 자동으로 만료된 선물 코드 등급을 free로 되돌린다(2026-07-25). AI
// 호출 없음, 비용 0 -- 위 reference-promotion 워커와 동일한 자동 시작 패턴.
const globalForGiftCodeExpiryWorker = globalThis as unknown as { giftCodeExpiryWorkerStarted?: boolean };
if (!isBuildPhaseForReferencePromotion && !globalForGiftCodeExpiryWorker.giftCodeExpiryWorkerStarted) {
  startGiftCodeExpiryWorker(adminContainer.revertExpiredGiftPlansUseCase);
  void scheduleGiftCodeExpiry();
  globalForGiftCodeExpiryWorker.giftCodeExpiryWorkerStarted = true;
}
