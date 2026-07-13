import { PrismaEditHistoryRepository } from "@/modules/edits/infrastructure/PrismaEditHistoryRepository";
import { CreateEditUseCase } from "@/modules/edits/application/CreateEditUseCase";
import { RetryEditUseCase } from "@/modules/edits/application/RetryEditUseCase";
import { GetEditHistoryUseCase } from "@/modules/edits/application/GetEditHistoryUseCase";
import { ProcessEditJobUseCase } from "@/modules/edits/application/ProcessEditJobUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { promptRepositoryInstance } from "@/modules/prompts/container";
import { generationRepositoryInstance } from "@/modules/generations/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { BullMqImageEditQueue } from "@/shared/queue/imageEditQueue";
import { resolveImageGenerationProvider } from "@/shared/ai/imageGenerationRouter";
import { startImageEditWorker } from "@/workers/imageEditWorker";

const editHistoryRepository = new PrismaEditHistoryRepository();
const queue = new BullMqImageEditQueue();

export const editsContainer = {
  createEditUseCase: new CreateEditUseCase(
    projectRepositoryInstance,
    generationRepositoryInstance,
    subscriptionsContainer.checkPlanUseCase,
    editHistoryRepository,
    queue,
  ),
  retryEditUseCase: new RetryEditUseCase(
    projectRepositoryInstance,
    generationRepositoryInstance,
    subscriptionsContainer.checkPlanUseCase,
    editHistoryRepository,
    queue,
  ),
  getEditHistoryUseCase: new GetEditHistoryUseCase(
    projectRepositoryInstance,
    generationRepositoryInstance,
    editHistoryRepository,
  ),
};

const processEditJobUseCase = new ProcessEditJobUseCase(
  projectRepositoryInstance,
  promptRepositoryInstance,
  generationRepositoryInstance,
  editHistoryRepository,
  subscriptionsContainer.recordUsageUseCase,
  resolveImageGenerationProvider(),
);

// Same MVP monolith auto-start pattern as generations/container.ts.
const globalForWorker = globalThis as unknown as { imageEditWorkerStarted?: boolean };
const isBuildPhase = process.env.npm_lifecycle_event === "build";
if (!isBuildPhase && !globalForWorker.imageEditWorkerStarted) {
  startImageEditWorker(processEditJobUseCase);
  globalForWorker.imageEditWorkerStarted = true;
}
