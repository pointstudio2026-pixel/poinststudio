import type { TrainingExampleRepository } from "@/modules/trainingExamples/domain/TrainingExampleRepository";
import type { FileStorage } from "@/shared/storage/FileStorage";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError } from "@/shared/errors/AppError";

export class DeleteTrainingExampleUseCase {
  constructor(
    private readonly trainingExampleRepository: TrainingExampleRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: { id: string; deletedByUserId: string }): Promise<void> {
    const example = await this.trainingExampleRepository.findById(input.id);
    if (!example) {
      throw new NotFoundError("학습 자료를 찾을 수 없습니다.", "TRAINING_EXAMPLE_NOT_FOUND");
    }

    await this.trainingExampleRepository.delete(example.id);
    await this.fileStorage.delete(example.imageStorageKey);

    await recordActivity({
      userId: input.deletedByUserId,
      eventType: "TRAINING_EXAMPLE_DELETED",
      payload: { trainingExampleId: example.id },
    });
  }
}
