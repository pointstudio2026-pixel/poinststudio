import type { TrainingExampleRepository } from "@/modules/trainingExamples/domain/TrainingExampleRepository";
import type { TrainingExample } from "@/modules/trainingExamples/domain/TrainingExample";

export class ListTrainingExamplesUseCase {
  constructor(private readonly trainingExampleRepository: TrainingExampleRepository) {}

  async execute(): Promise<TrainingExample[]> {
    return this.trainingExampleRepository.list();
  }
}
