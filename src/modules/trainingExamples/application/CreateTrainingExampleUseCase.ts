import type { TrainingExampleRepository } from "@/modules/trainingExamples/domain/TrainingExampleRepository";
import type { TrainingExample } from "@/modules/trainingExamples/domain/TrainingExample";
import type { FileStorage } from "@/shared/storage/FileStorage";
import {
  MAX_REFERENCE_SIZE_BYTES,
  isAllowedReferenceContentType,
} from "@/modules/userStyles/domain/userStyleRules";
import { DELIVERABLE_TYPE_OPTIONS } from "@/modules/projects/domain/deliverableTypes";
import { recordActivity } from "@/shared/activity/activityLogger";
import { ValidationError } from "@/shared/errors/AppError";

/**
 * 관리자가 (프롬프트, 생성 이미지)를 직접 입력하는 학습 자료 등록 --
 * userStyles의 AddReferenceImageUseCase와 동일한 업로드/검증 골격이지만,
 * 의도적으로 Vision AI 재분석 단계가 없다(비용 발생 금지). 이미지는 그대로
 * 저장만 하고, 실제 매칭은 trainingExampleRules.ts의 결정론적 키워드
 * 점수로만 이뤄진다.
 */
export class CreateTrainingExampleUseCase {
  constructor(
    private readonly trainingExampleRepository: TrainingExampleRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: {
    prompt: string;
    deliverableType: string;
    imageData: Buffer;
    imageContentType: string;
    createdByUserId: string;
  }): Promise<TrainingExample> {
    const prompt = input.prompt.trim();
    if (!prompt) {
      throw new ValidationError("프롬프트를 입력해주세요.", undefined, "TRAINING_EXAMPLE-001");
    }
    if (!DELIVERABLE_TYPE_OPTIONS.includes(input.deliverableType)) {
      throw new ValidationError("올바르지 않은 작업물 유형입니다.", undefined, "TRAINING_EXAMPLE-002");
    }
    if (!isAllowedReferenceContentType(input.imageContentType)) {
      throw new ValidationError("PNG 또는 JPEG 이미지만 업로드할 수 있습니다.", undefined, "TRAINING_EXAMPLE-003");
    }
    if (input.imageData.byteLength > MAX_REFERENCE_SIZE_BYTES) {
      throw new ValidationError("이미지 용량은 5MB를 초과할 수 없습니다.", undefined, "TRAINING_EXAMPLE-004");
    }

    const storageKey = `training-examples/${crypto.randomUUID()}`;
    const saved = await this.fileStorage.save(storageKey, input.imageData, input.imageContentType);

    const example = await this.trainingExampleRepository.create({
      prompt,
      deliverableType: input.deliverableType,
      imageStorageKey: saved.key,
      imageContentType: input.imageContentType,
      createdByUserId: input.createdByUserId,
    });

    await recordActivity({
      userId: input.createdByUserId,
      eventType: "TRAINING_EXAMPLE_CREATED",
      payload: { trainingExampleId: example.id, deliverableType: example.deliverableType },
    });

    return example;
  }
}
