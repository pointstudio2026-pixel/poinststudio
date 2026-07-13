import { PrismaGenerationRepository } from "@/modules/generations/infrastructure/PrismaGenerationRepository";
import { CreateGenerationUseCase } from "@/modules/generations/application/CreateGenerationUseCase";
import { RetryGenerationUseCase } from "@/modules/generations/application/RetryGenerationUseCase";
import { GetGenerationUseCase } from "@/modules/generations/application/GetGenerationUseCase";
import { GetGenerationStatusUseCase } from "@/modules/generations/application/GetGenerationStatusUseCase";
import { ProcessGenerationJobUseCase } from "@/modules/generations/application/ProcessGenerationJobUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { promptRepositoryInstance, promptsContainer } from "@/modules/prompts/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { BullMqImageGenerationQueue } from "@/shared/queue/imageGenerationQueue";
import { resolveImageGenerationProvider } from "@/shared/ai/imageGenerationRouter";
import { startImageGenerationWorker } from "@/workers/imageGenerationWorker";

const generationRepository = new PrismaGenerationRepository();
const queue = new BullMqImageGenerationQueue();

export const generationsContainer = {
  createGenerationUseCase: new CreateGenerationUseCase(
    projectRepositoryInstance,
    promptRepositoryInstance,
    promptsContainer.buildPromptUseCase,
    subscriptionsContainer.checkPlanUseCase,
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
};

const processGenerationJobUseCase = new ProcessGenerationJobUseCase(
  projectRepositoryInstance,
  promptRepositoryInstance,
  generationRepository,
  subscriptionsContainer.recordUsageUseCase,
  resolveImageGenerationProvider(),
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
