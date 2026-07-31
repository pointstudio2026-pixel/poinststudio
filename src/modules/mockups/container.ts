import { PrismaMockupRepository } from "@/modules/mockups/infrastructure/PrismaMockupRepository";
import { PrismaMockupTemplateRepository } from "@/modules/mockups/infrastructure/PrismaMockupTemplateRepository";
import { PrismaStandaloneMockupRepository } from "@/modules/mockups/infrastructure/PrismaStandaloneMockupRepository";
import { PrismaGuestMockupUsageRepository } from "@/modules/mockups/infrastructure/PrismaGuestMockupUsageRepository";
import { CreateMockupUseCase } from "@/modules/mockups/application/CreateMockupUseCase";
import { CreateStandaloneMockupUseCase } from "@/modules/mockups/application/CreateStandaloneMockupUseCase";
import { CheckGuestMockupLimitUseCase } from "@/modules/mockups/application/CheckGuestMockupLimitUseCase";
import { ClaimGuestMockupsUseCase } from "@/modules/mockups/application/ClaimGuestMockupsUseCase";
import { GetMockupsUseCase } from "@/modules/mockups/application/GetMockupsUseCase";
import { GetMockupTemplatesUseCase } from "@/modules/mockups/application/GetMockupTemplatesUseCase";
import { SearchMockupTemplatesUseCase } from "@/modules/mockups/application/SearchMockupTemplatesUseCase";
import { ToggleMockupFavoriteUseCase } from "@/modules/mockups/application/ToggleMockupFavoriteUseCase";
import { DeleteMockupUseCase } from "@/modules/mockups/application/DeleteMockupUseCase";
import { ProcessMockupJobUseCase } from "@/modules/mockups/application/ProcessMockupJobUseCase";
import { RecommendMockupCategoriesUseCase } from "@/modules/mockups/application/RecommendMockupCategoriesUseCase";
import { ListPastGenerationImagesUseCase } from "@/modules/mockups/application/ListPastGenerationImagesUseCase";
import { ListMyWorkUseCase } from "@/modules/mockups/application/ListMyWorkUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { interviewRepositoryInstance } from "@/modules/interviews/container";
import { generationRepositoryInstance } from "@/modules/generations/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { trainingExampleRepositoryInstance } from "@/modules/trainingExamples/container";
import { styleRepositoryInstance, styleSelectionRepositoryInstance } from "@/modules/styles/container";
import { BullMqMockupRenderQueue } from "@/shared/queue/mockupRenderQueue";
import { resolveMockupRenderProvider } from "@/shared/ai/mockupRenderRouter";
import { resolveFileStorage } from "@/shared/storage/fileStorageRouter";
import { startMockupRenderWorker } from "@/workers/mockupRenderWorker";

export const mockupRepositoryInstance = new PrismaMockupRepository();
const mockupRepository = mockupRepositoryInstance;
export const mockupTemplateRepositoryInstance = new PrismaMockupTemplateRepository();
const templateRepository = mockupTemplateRepositoryInstance;
export const standaloneMockupRepositoryInstance = new PrismaStandaloneMockupRepository();
export const guestMockupUsageRepositoryInstance = new PrismaGuestMockupUsageRepository();
const checkGuestMockupLimitUseCaseInstance = new CheckGuestMockupLimitUseCase(guestMockupUsageRepositoryInstance);
const queue = new BullMqMockupRenderQueue();
const standaloneMockupFileStorage = resolveFileStorage();

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
  searchMockupTemplatesUseCase: new SearchMockupTemplatesUseCase(templateRepository),
  listPastGenerationImagesUseCase: new ListPastGenerationImagesUseCase(generationRepositoryInstance),
  listMyWorkUseCase: new ListMyWorkUseCase(generationRepositoryInstance, standaloneMockupRepositoryInstance),
  checkGuestMockupLimitUseCase: checkGuestMockupLimitUseCaseInstance,
  claimGuestMockupsUseCase: new ClaimGuestMockupsUseCase(guestMockupUsageRepositoryInstance),
  createStandaloneMockupUseCase: new CreateStandaloneMockupUseCase(
    projectRepositoryInstance,
    templateRepository,
    standaloneMockupRepositoryInstance,
    standaloneMockupFileStorage,
    resolveMockupRenderProvider(),
    subscriptionsContainer.checkPlanUseCase,
    subscriptionsContainer.recordUsageUseCase,
    checkGuestMockupLimitUseCaseInstance,
    guestMockupUsageRepositoryInstance,
  ),
};

const processMockupJobUseCase = new ProcessMockupJobUseCase(
  projectRepositoryInstance,
  generationRepositoryInstance,
  mockupRepository,
  templateRepository,
  subscriptionsContainer.recordUsageUseCase,
  resolveMockupRenderProvider(),
  trainingExampleRepositoryInstance,
  interviewRepositoryInstance,
  styleSelectionRepositoryInstance,
  styleRepositoryInstance,
);

// Same MVP monolith auto-start pattern as generations/edits containers.
const globalForWorker = globalThis as unknown as { mockupRenderWorkerStarted?: boolean };
const isBuildPhase = process.env.npm_lifecycle_event === "build";
if (!isBuildPhase && !globalForWorker.mockupRenderWorkerStarted) {
  startMockupRenderWorker(processMockupJobUseCase);
  globalForWorker.mockupRenderWorkerStarted = true;
}
