import { PrismaGenerationRepository } from "@/modules/generations/infrastructure/PrismaGenerationRepository";
import { PrismaGenerationEvaluationRepository } from "@/modules/generations/infrastructure/PrismaGenerationEvaluationRepository";
import { PrismaGenerationFeedbackRepository } from "@/modules/generations/infrastructure/PrismaGenerationFeedbackRepository";
import { CreateGenerationUseCase } from "@/modules/generations/application/CreateGenerationUseCase";
import { RetryGenerationUseCase } from "@/modules/generations/application/RetryGenerationUseCase";
import { GetGenerationUseCase } from "@/modules/generations/application/GetGenerationUseCase";
import { GetGenerationStatusUseCase } from "@/modules/generations/application/GetGenerationStatusUseCase";
import { ProcessGenerationJobUseCase } from "@/modules/generations/application/ProcessGenerationJobUseCase";
import { SubmitGenerationFeedbackUseCase } from "@/modules/generations/application/SubmitGenerationFeedbackUseCase";
import { EvaluateGenerationVisionUseCase } from "@/modules/generations/application/EvaluateGenerationVisionUseCase";
import { GenerateFromLogoAssetUseCase } from "@/modules/generations/application/GenerateFromLogoAssetUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { promptRepositoryInstance, promptsContainer } from "@/modules/prompts/container";
import { promptDecisionRecordRepositoryInstance } from "@/modules/promptPriority/container";
import { interviewRepositoryInstance } from "@/modules/interviews/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { authContainer } from "@/modules/auth/container";
import { projectLogoAssetRepositoryInstance } from "@/modules/projectLogos/container";
import { styleRepositoryInstance, styleSelectionRepositoryInstance } from "@/modules/styles/container";
// mockups/container.ts를 직접 import하지 않는다 -- 그 파일이 이미
// generations/container.ts를 import해서 순환 참조가 생긴다. 리포지토리
// 클래스와 provider 라우터만 직접 가져와 새 인스턴스를 만든다(둘 다
// 상태 없는 얇은 Prisma/HTTP 래퍼라 인스턴스가 여러 개여도 문제없음).
import { PrismaMockupTemplateRepository } from "@/modules/mockups/infrastructure/PrismaMockupTemplateRepository";
import { resolveMockupRenderProvider } from "@/shared/ai/mockupRenderRouter";
import { resolveVisionEvaluationProvider } from "@/shared/ai/visionEvaluationRouter";
import { resolveFileStorage } from "@/shared/storage/fileStorageRouter";
import { BullMqImageGenerationQueue } from "@/shared/queue/imageGenerationQueue";
import { startImageGenerationWorker } from "@/workers/imageGenerationWorker";

export const generationRepositoryInstance = new PrismaGenerationRepository();
const generationRepository = generationRepositoryInstance;
export const generationEvaluationRepositoryInstance = new PrismaGenerationEvaluationRepository();
export const generationFeedbackRepositoryInstance = new PrismaGenerationFeedbackRepository();
const queue = new BullMqImageGenerationQueue();

export const generationsContainer = {
  createGenerationUseCase: new CreateGenerationUseCase(
    projectRepositoryInstance,
    promptRepositoryInstance,
    promptsContainer.buildPromptUseCase,
    subscriptionsContainer.checkPlanUseCase,
    authContainer.ensureEmailVerifiedUseCase,
    generationRepository,
    queue,
  ),
  retryGenerationUseCase: new RetryGenerationUseCase(
    projectRepositoryInstance,
    promptRepositoryInstance,
    subscriptionsContainer.checkPlanUseCase,
    generationRepository,
    queue,
  ),
  getGenerationUseCase: new GetGenerationUseCase(projectRepositoryInstance, generationRepository),
  getGenerationStatusUseCase: new GetGenerationStatusUseCase(projectRepositoryInstance, generationRepository),
  submitGenerationFeedbackUseCase: new SubmitGenerationFeedbackUseCase(
    projectRepositoryInstance,
    generationRepository,
    generationFeedbackRepositoryInstance,
  ),
};

const evaluateGenerationVisionUseCase = new EvaluateGenerationVisionUseCase(
  generationEvaluationRepositoryInstance,
  promptDecisionRecordRepositoryInstance,
  interviewRepositoryInstance,
  resolveVisionEvaluationProvider(),
);

const generateFromLogoAssetUseCase = new GenerateFromLogoAssetUseCase(
  resolveFileStorage(),
  new PrismaMockupTemplateRepository(),
  interviewRepositoryInstance,
  styleSelectionRepositoryInstance,
  styleRepositoryInstance,
  resolveMockupRenderProvider(),
);

const processGenerationJobUseCase = new ProcessGenerationJobUseCase(
  projectRepositoryInstance,
  promptRepositoryInstance,
  generationRepository,
  subscriptionsContainer.recordUsageUseCase,
  promptDecisionRecordRepositoryInstance,
  generationEvaluationRepositoryInstance,
  evaluateGenerationVisionUseCase,
  projectLogoAssetRepositoryInstance,
  generateFromLogoAssetUseCase,
);

// MVP monolith simplification: auto-start the Worker in-process instead of
// running it as a separate deployment (27_DeploymentArchitecture.md's
// intended shape for later). Guarded so it only starts once per process and
// never during `next build`'s route-analysis pass, which shouldn't open a
// live Redis connection.
const globalForWorker = globalThis as unknown as { imageGenerationWorkerStarted?: boolean };
const isBuildPhase = process.env.npm_lifecycle_event === "build";
if (!isBuildPhase && !globalForWorker.imageGenerationWorkerStarted) {
  startImageGenerationWorker(processGenerationJobUseCase);
  globalForWorker.imageGenerationWorkerStarted = true;
}
