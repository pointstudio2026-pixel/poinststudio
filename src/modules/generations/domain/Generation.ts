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
