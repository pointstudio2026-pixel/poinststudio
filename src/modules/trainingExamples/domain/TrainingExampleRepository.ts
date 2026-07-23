import type { TrainingExample } from "@/modules/trainingExamples/domain/TrainingExample";

export interface CreateTrainingExampleInput {
  prompt: string;
  deliverableType: string;
  imageStorageKey: string;
  imageContentType: string;
  createdByUserId: string;
}

export interface TrainingExampleRepository {
  create(input: CreateTrainingExampleInput): Promise<TrainingExample>;
  list(): Promise<TrainingExample[]>;
  listByDeliverableType(deliverableType: string): Promise<TrainingExample[]>;
  findById(id: string): Promise<TrainingExample | null>;
  delete(id: string): Promise<void>;
}
