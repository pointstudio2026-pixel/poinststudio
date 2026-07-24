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
  /**
   * "completed" 버전인데 GenerationEvaluation 행이 아예 없는 것들 -- 정상
   * 흐름이면 항상 같이 생기지만(ProcessGenerationJobUseCase), 완료 처리
   * 직후 배포 등으로 프로세스가 중단되면 두 쓰기 사이에 끊겨서 영구히
   * 누락될 수 있다. PromoteGenerationsToReferenceUseCase가 매 실행마다
   * 이걸 먼저 채워 넣어 자가 치유한다.
   */
  listCompletedWithoutEvaluation(limit: number): Promise<GenerationVersion[]>;
}
