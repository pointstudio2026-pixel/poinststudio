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
import type {
  CreateGenerationEvaluationInput,
  GenerationEvaluation,
} from "@/modules/generations/domain/GenerationEvaluation";
import type { GenerationEvaluationRepository } from "@/modules/generations/domain/GenerationEvaluationRepository";
import type { GenerationFeedback, SubmitGenerationFeedbackInput } from "@/modules/generations/domain/GenerationFeedback";
import type { GenerationFeedbackRepository } from "@/modules/generations/domain/GenerationFeedbackRepository";

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
      providerPreference: input.providerPreference ?? null,
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
      providerPreference: input.providerPreference ?? null,
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

export class FakeGenerationEvaluationRepository implements GenerationEvaluationRepository {
  evaluations: GenerationEvaluation[] = [];
  private nextId = 1;

  async create(input: CreateGenerationEvaluationInput): Promise<GenerationEvaluation> {
    const evaluation: GenerationEvaluation = {
      id: `generation-evaluation-${this.nextId++}`,
      generationVersionId: input.generationVersionId,
      status: input.status,
      hardConstraintPassed: input.hardConstraintPassed,
      issues: input.issues,
      usageScore: null,
      promotedToReference: false,
      createdAt: new Date(),
    };
    this.evaluations.push(evaluation);
    return evaluation;
  }

  async findByGenerationVersionId(generationVersionId: string): Promise<GenerationEvaluation | null> {
    return this.evaluations.find((e) => e.generationVersionId === generationVersionId) ?? null;
  }

  async updateUsageScore(id: string, usageScore: number, promotedToReference: boolean): Promise<GenerationEvaluation> {
    const index = this.evaluations.findIndex((e) => e.id === id);
    if (index === -1) throw new Error("evaluation not found");
    const updated = { ...this.evaluations[index]!, usageScore, promotedToReference };
    this.evaluations[index] = updated;
    return updated;
  }

  async listUnscored(limit: number): Promise<GenerationEvaluation[]> {
    return this.evaluations.filter((e) => e.usageScore === null).slice(0, limit);
  }
}

export class FakeGenerationFeedbackRepository implements GenerationFeedbackRepository {
  feedback: GenerationFeedback[] = [];
  private nextId = 1;

  async upsert(input: SubmitGenerationFeedbackInput): Promise<GenerationFeedback> {
    const existingIndex = this.feedback.findIndex((f) => f.generationVersionId === input.generationVersionId);
    const record: GenerationFeedback = {
      id: existingIndex >= 0 ? this.feedback[existingIndex]!.id : `generation-feedback-${this.nextId++}`,
      generationVersionId: input.generationVersionId,
      likedTags: input.likedTags,
      dislikedTags: input.dislikedTags,
      freeText: input.freeText,
      createdAt: existingIndex >= 0 ? this.feedback[existingIndex]!.createdAt : new Date(),
    };
    if (existingIndex >= 0) {
      this.feedback[existingIndex] = record;
    } else {
      this.feedback.push(record);
    }
    return record;
  }

  async findByGenerationVersionId(generationVersionId: string): Promise<GenerationFeedback | null> {
    return this.feedback.find((f) => f.generationVersionId === generationVersionId) ?? null;
  }
}
