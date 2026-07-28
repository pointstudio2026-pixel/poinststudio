import type { StandaloneMockup, StandaloneMockupSourceType } from "@/modules/mockups/domain/StandaloneMockup";

export interface CreateStandaloneMockupInput {
  userId: string;
  projectId: string;
  templateId: string;
  sourceType: StandaloneMockupSourceType;
  status: "completed" | "failed";
  resultImageUrl?: string | null;
  thumbnailUrl?: string | null;
  provider?: string | null;
  errorMessage?: string | null;
  costAmount?: number | null;
}

export interface StandaloneMockupRepository {
  create(input: CreateStandaloneMockupInput): Promise<StandaloneMockup>;
  listByUserId(userId: string, limit?: number): Promise<StandaloneMockup[]>;
}
