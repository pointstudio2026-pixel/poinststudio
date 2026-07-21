import type { UserStyleCategoryRepository } from "@/modules/userStyles/domain/UserStyleCategoryRepository";
import type { UserStyleReferenceRepository } from "@/modules/userStyles/domain/UserStyleReferenceRepository";
import type { UserStyleCategory } from "@/modules/userStyles/domain/UserStyle";
import {
  MAX_REFERENCES_PER_CATEGORY,
  MAX_REFERENCE_SIZE_BYTES,
  isAllowedReferenceContentType,
} from "@/modules/userStyles/domain/userStyleRules";
import { analyzeStyleReferenceImages } from "@/modules/userStyles/application/analyzeStyleReferenceImages";
import type { FileStorage } from "@/shared/storage/FileStorage";
import type { TextCompletionProvider } from "@/shared/ai/TextCompletionProvider";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

export class AddReferenceImageUseCase {
  constructor(
    private readonly categoryRepository: UserStyleCategoryRepository,
    private readonly referenceRepository: UserStyleReferenceRepository,
    private readonly fileStorage: FileStorage,
    private readonly textCompletionProvider: TextCompletionProvider,
  ) {}

  async execute(input: {
    userId: string;
    categoryId: string;
    data: Buffer;
    contentType: string;
  }): Promise<UserStyleCategory> {
    const category = await this.categoryRepository.findById(input.categoryId);
    if (!category || category.userId !== input.userId) {
      throw new NotFoundError("스타일 카테고리를 찾을 수 없습니다.", "USER_STYLE_CATEGORY_NOT_FOUND");
    }

    if (!isAllowedReferenceContentType(input.contentType)) {
      throw new ValidationError("PNG 또는 JPEG 이미지만 업로드할 수 있습니다.", undefined, "USER_STYLE-002");
    }
    if (input.data.byteLength > MAX_REFERENCE_SIZE_BYTES) {
      throw new ValidationError("이미지 용량은 5MB를 초과할 수 없습니다.", undefined, "USER_STYLE-003");
    }

    const existing = await this.referenceRepository.listByCategoryId(category.id);
    if (existing.length >= MAX_REFERENCES_PER_CATEGORY) {
      throw new ValidationError(
        `카테고리당 참고 이미지는 최대 ${MAX_REFERENCES_PER_CATEGORY}장까지 등록할 수 있습니다.`,
        undefined,
        "USER_STYLE-004",
      );
    }

    const storageKey = `user-styles/${input.userId}/${category.id}/${crypto.randomUUID()}`;
    const saved = await this.fileStorage.save(storageKey, input.data, input.contentType);
    await this.referenceRepository.addToCategory(category.id, saved.key, input.contentType);

    // 이미지가 바뀌었으므로 스타일 설명을 다시 분석한다 -- 카테고리 전체
    // 참고 이미지 집합을 기준으로 하나의 설명을 유지한다.
    const allReferences = await this.referenceRepository.listByCategoryId(category.id);
    const images = await Promise.all(
      allReferences.map(async (ref) => {
        const file = await this.fileStorage.read(ref.storageKey);
        return file ? { dataUri: `data:${file.contentType};base64,${file.data.toString("base64")}`, contentType: file.contentType } : null;
      }),
    );
    const description = await analyzeStyleReferenceImages(
      this.textCompletionProvider,
      images.filter((img): img is { dataUri: string; contentType: string } => img !== null),
    );
    const updated = await this.categoryRepository.updateDescription(category.id, description);

    await recordActivity({
      userId: input.userId,
      eventType: "USER_STYLE_REFERENCE_ADDED",
      payload: { categoryId: category.id, analyzed: description !== null },
    });

    return updated;
  }
}
