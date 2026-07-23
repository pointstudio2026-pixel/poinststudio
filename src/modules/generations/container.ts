import { PrismaGenerationRepository } from "@/modules/generations/infrastructure/PrismaGenerationRepository";
import { PrismaGenerationEvaluationRepository } from "@/modules/generations/infrastructure/PrismaGenerationEvaluationRepository";
import { PrismaGenerationFeedbackRepository } from "@/modules/generations/infrastructure/PrismaGenerationFeedbackRepository";
import { CreateGenerationUseCase } from "@/modules/generations/application/CreateGenerationUseCase";
import { RetryGenerationUseCase } from "@/modules/generations/application/RetryGenerationUseCase";
import { GetGenerationUseCase } from "@/modules/generations/application/GetGenerationUseCase";
import { GetGenerationStatusUseCase } from "@/modules/generations/application/GetGenerationStatusUseCase";
import { ProcessGenerationJobUseCase } from "@/modules/generations/application/ProcessGenerationJobUseCase";
import { SubmitGenerationFeedbackUseCase } from "@/modules/generations/application/SubmitGenerationFeedbackUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { promptRepositoryInstance, promptsContainer } from "@/modules/prompts/container";
import { promptDecisionRecordRepositoryInstance } from "@/modules/promptPriority/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { authContainer } from "@/modules/auth/container";
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

const processGenerationJobUseCase = new ProcessGenerationJobUseCase(
  projectRepositoryInstance,
  promptRepositoryInstance,
  generationRepository,
  subscriptionsContainer.recordUsageUseCase,
  promptDecisionRecordRepositoryInstance,
  generationEvaluationRepositoryInstance,
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
