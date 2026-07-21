import type { UserStyleCategoryRepository } from "@/modules/userStyles/domain/UserStyleCategoryRepository";
import type { UserStyleReferenceRepository } from "@/modules/userStyles/domain/UserStyleReferenceRepository";
import type { UserStyleCategory } from "@/modules/userStyles/domain/UserStyle";
import { analyzeStyleReferenceImages } from "@/modules/userStyles/application/analyzeStyleReferenceImages";
import type { FileStorage } from "@/shared/storage/FileStorage";
import type { TextCompletionProvider } from "@/shared/ai/TextCompletionProvider";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";

export class ReanalyzeUserStyleCategoryUseCase {
  constructor(
    private readonly categoryRepository: UserStyleCategoryRepository,
    private readonly referenceRepository: UserStyleReferenceRepository,
    private readonly fileStorage: FileStorage,
    private readonly textCompletionProvider: TextCompletionProvider,
  ) {}

  async execute(input: { userId: string; categoryId: string }): Promise<UserStyleCategory> {
    const category = await this.categoryRepository.findById(input.categoryId);
    if (!category || category.userId !== input.userId) {
      throw new NotFoundError("스타일 카테고리를 찾을 수 없습니다.", "USER_STYLE_CATEGORY_NOT_FOUND");
    }

    const references = await this.referenceRepository.listByCategoryId(category.id);
    if (references.length === 0) {
      throw new ConflictError("참고 이미지가 하나도 없습니다.", "USER_STYLE-005");
    }

    const images = await Promise.all(
      references.map(async (ref) => {
        const file = await this.fileStorage.read(ref.storageKey);
        return file ? { dataUri: `data:${file.contentType};base64,${file.data.toString("base64")}`, contentType: file.contentType } : null;
      }),
    );
    const description = await analyzeStyleReferenceImages(
      this.textCompletionProvider,
      images.filter((img): img is { dataUri: string; contentType: string } => img !== null),
    );

    return this.categoryRepository.updateDescription(category.id, description);
  }
}
