import type { MockupCategory, MockupTemplate } from "@/modules/mockups/domain/Mockup";
import type { Locale } from "@/shared/i18n/locale";

export interface CreateMockupTemplateInput {
  category: MockupCategory;
  name: string;
  slug: string;
  description: string;
  backgroundUrl: string;
  placementArea: { xPct: number; yPct: number; widthPct: number; heightPct: number };
  fullDesignPlacementArea?: { xPct: number; yPct: number; widthPct: number; heightPct: number } | null;
  keywords: string[];
  containsKoreanText: boolean;
  isGeneric: boolean;
}

export interface MockupTemplateRepository {
  /** locale이 "ko"가 아니면 배경 사진에 한글 텍스트가 박힌 템플릿(containsKoreanText)은 제외한다. */
  list(category?: MockupCategory, locale?: Locale): Promise<MockupTemplate[]>;
  findById(id: string): Promise<MockupTemplate | null>;
  listCategories(): Promise<MockupCategory[]>;
  /** "목업" 단독 프로세스의 배경 갤러리 검색 -- name/description/keywords 중 하나라도 매치되면 반환.
   * locale이 "ko"가 아니면 배경 사진에 한글이 박힌 템플릿은 제외한다. */
  search(query: string, locale?: Locale): Promise<MockupTemplate[]>;

  // --- 관리자 CRUD 전용(ops-portal-7x2q/mockup-templates) ---
  /** hidden 포함 전체, 관리 화면용. */
  listAll(): Promise<MockupTemplate[]>;
  create(input: CreateMockupTemplateInput): Promise<MockupTemplate>;
  /** MockupProject/StandaloneMockup이 이 템플릿을 실제로 참조하는 행 수 -- 삭제 방식(하드/소프트) 결정에 쓴다. */
  countUsages(id: string): Promise<number>;
  hide(id: string): Promise<void>;
  hardDelete(id: string): Promise<void>;
}
