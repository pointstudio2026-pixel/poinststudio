import type { MockupCategory, MockupTemplate } from "@/modules/mockups/domain/Mockup";
import type { Locale } from "@/shared/i18n/locale";

export interface MockupTemplateRepository {
  /** locale이 "ko"가 아니면 배경 사진에 한글 텍스트가 박힌 템플릿(containsKoreanText)은 제외한다. */
  list(category?: MockupCategory, locale?: Locale): Promise<MockupTemplate[]>;
  findById(id: string): Promise<MockupTemplate | null>;
  listCategories(): Promise<MockupCategory[]>;
  /** "목업" 단독 프로세스의 배경 갤러리 검색 -- name/description/keywords 중 하나라도 매치되면 반환.
   * locale이 "ko"가 아니면 배경 사진에 한글이 박힌 템플릿은 제외한다. */
  search(query: string, locale?: Locale): Promise<MockupTemplate[]>;
}
