import type { MockupCategory, MockupTemplate } from "@/modules/mockups/domain/Mockup";

export interface MockupTemplateRepository {
  list(category?: MockupCategory): Promise<MockupTemplate[]>;
  findById(id: string): Promise<MockupTemplate | null>;
  listCategories(): Promise<MockupCategory[]>;
  /** "목업" 단독 프로세스의 배경 갤러리 검색 -- name/description/keywords 중 하나라도 매치되면 반환. */
  search(query: string): Promise<MockupTemplate[]>;
}
