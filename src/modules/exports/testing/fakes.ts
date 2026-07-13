import type { ExportJob } from "@/modules/exports/domain/Export";
import type {
  CreateExportInput,
  ExportRepository,
  UpdateExportResultInput,
} from "@/modules/exports/domain/ExportRepository";
import type { EnqueueExportInput, ExportQueuePort } from "@/modules/exports/domain/ExportQueuePort";

export class FakeExportRepository implements ExportRepository {
  jobs: ExportJob[] = [];
  private nextId = 1;

  async create(input: CreateExportInput): Promise<ExportJob> {
    const job: ExportJob = {
      id: `export-${this.nextId++}`,
      projectId: input.projectId,
      source: input.source,
      format: input.format,
      sourceRefId: input.sourceRefId,
      sections: input.sections,
      includeBrandInfo: input.includeBrandInfo,
      watermarked: input.watermarked,
      status: "pending",
      fileKey: null,
      fileSizeBytes: null,
      errorMessage: null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.jobs.push(job);
    return job;
  }

  async getById(id: string): Promise<ExportJob | null> {
    return this.jobs.find((j) => j.id === id) ?? null;
  }

  async updateResult(id: string, patch: UpdateExportResultInput): Promise<ExportJob> {
    const index = this.jobs.findIndex((j) => j.id === id);
    if (index === -1) throw new Error("export job not found");
    const current = this.jobs[index]!;
    const updated: ExportJob = {
      ...current,
      status: patch.status,
      fileKey: patch.fileKey ?? current.fileKey,
      fileSizeBytes: patch.fileSizeBytes ?? current.fileSizeBytes,
      errorMessage: patch.errorMessage !== undefined ? patch.errorMessage : current.errorMessage,
      completedAt: patch.completedAt ?? current.completedAt,
    };
    this.jobs[index] = updated;
    return updated;
  }

  async listByProjectId(projectId: string): Promise<ExportJob[]> {
    return this.jobs
      .filter((j) => j.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export class FakeExportQueue implements ExportQueuePort {
  enqueued: EnqueueExportInput[] = [];

  async enqueue(input: EnqueueExportInput): Promise<void> {
    this.enqueued.push(input);
  }
}
