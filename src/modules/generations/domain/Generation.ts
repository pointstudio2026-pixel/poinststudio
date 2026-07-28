export type GenerationStatus = "pending" | "processing" | "completed" | "failed";

export interface GeneratedImage {
  url: string;
  thumbnailUrl: string;
}

export interface GenerationVersion {
  id: string;
  generationId: string;
  versionNumber: number;
  promptVersionId: string;
  status: GenerationStatus;
  provider: string | null;
  /** User's requested provider ("openai"|"gemini") at creation time -- distinct from `provider`, which is the actual provider that produced the result. */
  providerPreference: string | null;
  images: GeneratedImage[];
  errorMessage: string | null;
  costAmount: number | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface Generation {
  id: string;
  projectId: string;
  currentVersion: GenerationVersion;
}

/**
 * "목업" 단독 프로세스의 로고 선택 단계가 쓰는, 사용자 전체 프로젝트를
 * 가로지르는 평탄화된 이미지 목록 -- GenerationVersion 하나에 이미지가
 * 여러 장 있을 수 있어 이미지 1장당 항목 1개로 펼친다.
 */
export interface PastGenerationImage {
  projectId: string;
  projectName: string;
  generationVersionId: string;
  imageIndex: number;
  url: string;
  thumbnailUrl: string;
  createdAt: Date;
}
