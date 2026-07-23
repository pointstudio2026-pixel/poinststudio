import { PrismaMockupRepository } from "@/modules/mockups/infrastructure/PrismaMockupRepository";
import { PrismaMockupTemplateRepository } from "@/modules/mockups/infrastructure/PrismaMockupTemplateRepository";
import { CreateMockupUseCase } from "@/modules/mockups/application/CreateMockupUseCase";
import { GetMockupsUseCase } from "@/modules/mockups/application/GetMockupsUseCase";
import { GetMockupTemplatesUseCase } from "@/modules/mockups/application/GetMockupTemplatesUseCase";
import { ToggleMockupFavoriteUseCase } from "@/modules/mockups/application/ToggleMockupFavoriteUseCase";
import { DeleteMockupUseCase } from "@/modules/mockups/application/DeleteMockupUseCase";
import { ProcessMockupJobUseCase } from "@/modules/mockups/application/ProcessMockupJobUseCase";
import { RecommendMockupCategoriesUseCase } from "@/modules/mockups/application/RecommendMockupCategoriesUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { interviewRepositoryInstance } from "@/modules/interviews/container";
import { generationRepositoryInstance } from "@/modules/generations/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { trainingExampleRepositoryInstance } from "@/modules/trainingExamples/container";
import { BullMqMockupRenderQueue } from "@/shared/queue/mockupRenderQueue";
import { resolveMockupRenderProvider } from "@/shared/ai/mockupRenderRouter";
import { startMockupRenderWorker } from "@/workers/mockupRenderWorker";

export const mockupRepositoryInstance = new PrismaMockupRepository();
const mockupRepository = mockupRepositoryInstance;
const templateRepository = new PrismaMockupTemplateRepository();
const queue = new BullMqMockupRenderQueue();

export const mockupsContainer = {
  createMockupUseCase: new CreateMockupUseCase(
    projectRepositoryInstance,
    generationRepositoryInstance,
    templateRepository,
    subscriptionsContainer.checkPlanUseCase,
    mockupRepository,
    queue,
  ),
  getMockupsUseCase: new GetMockupsUseCase(projectRepositoryInstance, mockupRepository),
  getMockupTemplatesUseCase: new GetMockupTemplatesUseCase(templateRepository),
  recommendMockupCategoriesUseCase: new RecommendMockupCategoriesUseCase(
    projectRepositoryInstance,
    interviewRepositoryInstance,
  ),
  toggleMockupFavoriteUseCase: new ToggleMockupFavoriteUseCase(projectRepositoryInstance, mockupRepository),
  deleteMockupUseCase: new DeleteMockupUseCase(projectRepositoryInstance, mockupRepository),
};

const processMockupJobUseCase = new ProcessMockupJobUseCase(
  projectRepositoryInstance,
  generationRepositoryInstance,
  mockupRepository,
  templateRepository,
  subscriptionsContainer.recordUsageUseCase,
  resolveMockupRenderProvider(),
  trainingExampleRepositoryInstance,
);

// Same MVP monolith auto-start pattern as generations/edits containers.
const globalForWorker = globalThis as unknown as { mockupRenderWorkerStarted?: boolean };
const isBuildPhase = process.env.npm_lifecycle_event === "build";
if (!isBuildPhase && !globalForWorker.mockupRenderWorkerStarted) {
  startMockupRenderWorker(processMockupJobUseCase);
  globalForWorker.mockupRenderWorkerStarted = true;
}
