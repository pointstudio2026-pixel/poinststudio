import type { CreateIndustryInput, Industry, UpdateIndustryInput } from "@/modules/industries/domain/Industry";
import type { Locale } from "@/shared/i18n/locale";

export interface IndustryRepository {
  /** 활성 업종만, name 오름차순 -- 검색어 없는 드롭다운 초기 목록용.
   * locale이 ko가 아니면 IndustryTranslation을 조인해 displayName을 채운다
   * (번역이 없는 행은 한국어 name으로 폴백). */
  listActive(locale?: Locale): Promise<Industry[]>;
  /** name/recommendedKeywords(해당 locale의 번역 포함) 대상 검색 -- 활성 업종만.
   * 부분일치뿐 아니라 편집거리 기반 유사매칭도 포함한다(예: "바베큐"/"바비큐"
   * 같은 표기 변형 허용). */
  search(query: string, locale?: Locale): Promise<Industry[]>;
  /** answers.industry에 저장된 원문과 정확히 일치하는 행 조회 -- 프롬프트 빌더가
   * 이 업종의 메타데이터를 찾을 때 쓴다. 없으면 null(자유 입력/"기타"). */
  findByName(name: string): Promise<Industry | null>;
  findById(id: string): Promise<Industry | null>;
  /** admin CRUD 전용 -- 비활성 포함 전체, name 오름차순. */
  listAll(): Promise<Industry[]>;
  create(input: CreateIndustryInput): Promise<Industry>;
  update(id: string, input: UpdateIndustryInput): Promise<Industry>;
  delete(id: string): Promise<void>;
}
