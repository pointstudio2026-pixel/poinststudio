import type { MockupCategory, MockupProject } from "@/modules/mockups/domain/Mockup";
import type { GenerationStatus } from "@/modules/generations/domain/Generation";

export interface CreateMockupInput {
  projectId: string;
  generationVersionId: string;
  sourceImageIndex: number;
  templateId: string;
}

export interface UpdateMockupResultInput {
  status: GenerationStatus;
  resultImageUrl?: string;
  thumbnailUrl?: string;
  provider?: string;
  errorMessage?: string | null;
  costAmount?: number;
  completedAt?: Date;
}

export interface MockupRepository {
  create(input: CreateMockupInput): Promise<MockupProject>;
  getById(id: string): Promise<MockupProject | null>;
  updateResult(id: string, patch: UpdateMockupResultInput): Promise<MockupProject>;
  setFavorite(id: string, favorite: boolean): Promise<MockupProject>;
  delete(id: string): Promise<void>;
  listByProjectId(projectId: string, category?: MockupCategory): Promise<MockupProject[]>;
}
