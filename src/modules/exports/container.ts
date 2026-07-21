import { PrismaExportRepository } from "@/modules/exports/infrastructure/PrismaExportRepository";
import { PdfLibExportRenderer } from "@/modules/exports/infrastructure/PdfLibExportRenderer";
import { CreateExportUseCase } from "@/modules/exports/application/CreateExportUseCase";
import { GetExportsUseCase } from "@/modules/exports/application/GetExportsUseCase";
import { GetExportStatusUseCase } from "@/modules/exports/application/GetExportStatusUseCase";
import { DownloadExportUseCase } from "@/modules/exports/application/DownloadExportUseCase";
import { ProcessExportJobUseCase } from "@/modules/exports/application/ProcessExportJobUseCase";
import { projectRepositoryInstance } from "@/modules/projects/container";
import { conceptBoardRepositoryInstance } from "@/modules/conceptBoards/container";
import { generationRepositoryInstance } from "@/modules/generations/container";
import { mockupRepositoryInstance } from "@/modules/mockups/container";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { resolveFileStorage } from "@/shared/storage/fileStorageRouter";
import { BullMqExportQueue } from "@/shared/queue/exportQueue";
import { startExportWorker } from "@/workers/exportWorker";

const exportRepository = new PrismaExportRepository();
const renderer = new PdfLibExportRenderer();
const fileStorage = resolveFileStorage();
const queue = new BullMqExportQueue();

export const exportsContainer = {
  createExportUseCase: new CreateExportUseCase(
    projectRepositoryInstance,
    conceptBoardRepositoryInstance,
    generationRepositoryInstance,
    mockupRepositoryInstance,
    subscriptionsContainer.getSubscriptionUseCase,
    exportRepository,
    queue,
  ),
  getExportsUseCase: new GetExportsUseCase(projectRepositoryInstance, exportRepository),
  getExportStatusUseCase: new GetExportStatusUseCase(projectRepositoryInstance, exportRepository),
  downloadExportUseCase: new DownloadExportUseCase(projectRepositoryInstance, exportRepository, fileStorage),
};

const processExportJobUseCase = new ProcessExportJobUseCase(
  projectRepositoryInstance,
  conceptBoardRepositoryInstance,
  generationRepositoryInstance,
  mockupRepositoryInstance,
  exportRepository,
  renderer,
  fileStorage,
  subscriptionsContainer.recordUsageUseCase,
);

// Same MVP monolith auto-start pattern as the other three queue containers.
const globalForWorker = globalThis as unknown as { exportWorkerStarted?: boolean };
const isBuildPhase = process.env.npm_lifecycle_event === "build";
if (!isBuildPhase && !globalForWorker.exportWorkerStarted) {
  startExportWorker(processExportJobUseCase);
  globalForWorker.exportWorkerStarted = true;
}
