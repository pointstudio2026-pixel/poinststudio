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
import {
  generationEvaluationRepositoryInstance,
  generationFeedbackRepositoryInstance,
  generationRepositoryInstance,
} from "@/modules/generations/container";
import { exportRepositoryInstance } from "@/modules/exports/container";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { interviewRepositoryInstance } from "@/modules/interviews/container";
import { promptRepositoryInstance } from "@/modules/prompts/container";
import { promptDecisionRecordRepositoryInstance } from "@/modules/promptPriority/container";
import { trainingExampleRepositoryInstance } from "@/modules/trainingExamples/container";
import { scheduleReferencePromotion } from "@/shared/queue/referencePromotionQueue";
import { startReferencePromotionWorker } from "@/workers/referencePromotionWorker";
import { resolveTextCompletionProvider } from "@/shared/ai/textCompletionRouter";
import { resolveImageGenerationProvider } from "@/shared/ai/imageGenerationRouter";
import { resolveMockupRenderProvider } from "@/shared/ai/mockupRenderRouter";
import { imageGenerationQueue } from "@/shared/queue/imageGenerationQueue";
import { imageEditQueue } from "@/shared/queue/imageEditQueue";
import { mockupRenderQueue } from "@/shared/queue/mockupRenderQueue";
import { exportQueue } from "@/shared/queue/exportQueue";
import { subscriptionsContainer } from "@/modules/subscriptions/container";

const adminRepository = new PrismaAdminRepository();
const announcementRepository = new PrismaAnnouncementRepository();
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
    exportRepositoryInstance,
    projectRepositoryInstance,
    interviewRepositoryInstance,
    promptRepositoryInstance,
    promptDecisionRecordRepositoryInstance,
    trainingExampleRepositoryInstance,
  ),
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
