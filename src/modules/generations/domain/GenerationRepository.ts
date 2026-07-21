import type { GeneratedImage, Generation, GenerationStatus, GenerationVersion } from "@/modules/generations/domain/Generation";

export interface CreateGenerationVersionInput {
  promptVersionId: string;
  providerPreference?: string | null;
}

export interface UpdateGenerationVersionResultInput {
  status: GenerationStatus;
  provider?: string;
  images?: GeneratedImage[];
  errorMessage?: string | null;
  costAmount?: number;
  completedAt?: Date;
}

export interface GenerationRepository {
  findByProjectId(projectId: string): Promise<Generation | null>;
  findById(generationId: string): Promise<{ id: string; projectId: string } | null>;
  /** Creates the generation and its first version (v1, status "pending") in one step. */
  createWithFirstVersion(projectId: string, input: CreateGenerationVersionInput): Promise<Generation>;
  /** Appends a new pending version -- used for both "다중 생성" and retries. */
  addVersion(generationId: string, input: CreateGenerationVersionInput): Promise<Generation>;
  getVersionById(versionId: string): Promise<GenerationVersion | null>;
  updateVersionResult(versionId: string, patch: UpdateGenerationVersionResultInput): Promise<GenerationVersion>;
  listVersions(generationId: string): Promise<GenerationVersion[]>;
}
