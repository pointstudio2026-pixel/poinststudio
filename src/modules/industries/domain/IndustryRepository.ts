import type { CreateIndustryInput, Industry, UpdateIndustryInput } from "@/modules/industries/domain/Industry";

export interface IndustryRepository {
  /** 활성 업종만, name 오름차순 -- 검색어 없는 드롭다운 초기 목록용. */
  listActive(): Promise<Industry[]>;
  /** name/recommendedKeywords 대상 검색 -- 활성 업종만. */
  search(query: string): Promise<Industry[]>;
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
