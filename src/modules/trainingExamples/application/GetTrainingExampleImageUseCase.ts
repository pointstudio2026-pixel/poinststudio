import type { TrainingExampleRepository } from "@/modules/trainingExamples/domain/TrainingExampleRepository";
import type { FileStorage } from "@/shared/storage/FileStorage";
import { NotFoundError } from "@/shared/errors/AppError";

/** GetUserStyleReferenceImageUseCase와 동일한 패턴 -- 조회 후 Buffer 스트리밍(관리자 전용이라 소유자 확인은 라우트의 requireAdmin이 담당). */
export class GetTrainingExampleImageUseCase {
  constructor(
    private readonly trainingExampleRepository: TrainingExampleRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: { id: string }): Promise<{ data: Buffer; contentType: string }> {
    const example = await this.trainingExampleRepository.findById(input.id);
    if (!example) {
      throw new NotFoundError("학습 자료를 찾을 수 없습니다.", "TRAINING_EXAMPLE_NOT_FOUND");
    }

    if (!example.imageStorageKey) {
      throw new NotFoundError("이 학습 자료는 이미지가 저장되어 있지 않습니다.", "TRAINING_EXAMPLE_FILE_NOT_FOUND");
    }
    const file = await this.fileStorage.read(example.imageStorageKey);
    if (!file) {
      throw new NotFoundError("이미지 파일을 찾을 수 없습니다.", "TRAINING_EXAMPLE_FILE_NOT_FOUND");
    }

    return file;
  }
}
