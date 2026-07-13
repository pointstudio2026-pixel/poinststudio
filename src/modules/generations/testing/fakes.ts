import type { Generation, GenerationVersion } from "@/modules/generations/domain/Generation";
import type {
  CreateGenerationVersionInput,
  GenerationRepository,
  UpdateGenerationVersionResultInput,
} from "@/modules/generations/domain/GenerationRepository";
import type {
  EnqueueImageGenerationInput,
  ImageGenerationQueuePort,
} from "@/modules/generations/domain/ImageGenerationQueuePort";

export class FakeGenerationRepository implements GenerationRepository {
  generations = new Map<string, { id: string; projectId: string }>();
  versions: GenerationVersion[] = [];
  private nextGenerationId = 1;
  private nextVersionId = 1;

  async findByProjectId(projectId: string): Promise<Generation | null> {
    const generation = [...this.generations.values()].find((g) => g.projectId === projectId);
    if (!generation) return null;
    const current = this.versions
      .filter((v) => v.generationId === generation.id)
      .sort((a, b) => b.versionNumber - a.versionNumber)[0];
    if (!current) return null;
    return { id: generation.id, projectId: generation.projectId, currentVersion: current };
  }

  async findById(generationId: string): Promise<{ id: string; projectId: string } | null> {
    return this.generations.get(generationId) ?? null;
  }

  async createWithFirstVersion(
    projectId: string,
    input: CreateGenerationVersionInput,
  ): Promise<Generation> {
    const id = `generation-${this.nextGenerationId++}`;
    this.generations.set(id, { id, projectId });
    const version: GenerationVersion = {
      id: `generation-version-${this.nextVersionId++}`,
      generationId: id,
      versionNumber: 1,
      promptVersionId: input.promptVersionId,
      status: "pending",
      provider: null,
      images: [],
      errorMessage: null,
      costAmount: null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.versions.push(version);
    return { id, projectId, currentVersion: version };
  }

  async addVersion(generationId: string, input: CreateGenerationVersionInput): Promise<Generation> {
    const generation = this.generations.get(generationId);
    if (!generation) throw new Error("generation not found");
    const lastVersionNumber = Math.max(
      0,
      ...this.versions.filter((v) => v.generationId === generationId).map((v) => v.versionNumber),
    );
    const version: GenerationVersion = {
      id: `generation-version-${this.nextVersionId++}`,
      generationId,
      versionNumber: lastVersionNumber + 1,
      promptVersionId: input.promptVersionId,
      status: "pending",
      provider: null,
      images: [],
      errorMessage: null,
      costAmount: null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.versions.push(version);
    return { id: generationId, projectId: generation.projectId, currentVersion: version };
  }

  async getVersionById(versionId: string): Promise<GenerationVersion | null> {
    return this.versions.find((v) => v.id === versionId) ?? null;
  }

  async updateVersionResult(
    versionId: string,
    patch: UpdateGenerationVersionResultInput,
  ): Promise<GenerationVersion> {
    const index = this.versions.findIndex((v) => v.id === versionId);
    if (index === -1) throw new Error("version not found");
    const current = this.versions[index]!;
    const updated: GenerationVersion = {
      ...current,
      status: patch.status,
      provider: patch.provider ?? current.provider,
      images: patch.images ?? current.images,
      errorMessage: patch.errorMessage !== undefined ? patch.errorMessage : current.errorMessage,
      costAmount: patch.costAmount ?? current.costAmount,
      completedAt: patch.completedAt ?? current.completedAt,
    };
    this.versions[index] = updated;
    return updated;
  }

  async listVersions(generationId: string): Promise<GenerationVersion[]> {
    return this.versions
      .filter((v) => v.generationId === generationId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }
}

export class FakeImageGenerationQueue implements ImageGenerationQueuePort {
  enqueued: EnqueueImageGenerationInput[] = [];

  async enqueue(input: EnqueueImageGenerationInput): Promise<void> {
    this.enqueued.push(input);
  }
}
