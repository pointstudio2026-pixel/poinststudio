import type { GenerationStatus } from "@/modules/generations/domain/Generation";

export type StandaloneMockupSourceType = "upload" | "past_generation";

export interface StandaloneMockup {
  id: string;
  userId: string;
  projectId: string;
  templateId: string;
  sourceType: StandaloneMockupSourceType;
  status: GenerationStatus;
  resultImageUrl: string | null;
  thumbnailUrl: string | null;
  provider: string | null;
  errorMessage: string | null;
  costAmount: number | null;
  createdAt: Date;
}
