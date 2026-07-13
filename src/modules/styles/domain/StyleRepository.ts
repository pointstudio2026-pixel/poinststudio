import type { Style } from "@/modules/styles/domain/Style";

export interface StyleListFilter {
  category?: string;
  level?: number;
  search?: string;
}

export interface StyleRepository {
  list(filter: StyleListFilter): Promise<Style[]>;
  findById(id: string): Promise<Style | null>;
  findByIds(ids: string[]): Promise<Style[]>;
  /** Sibling leaf styles under the same parent, for "유사 스타일 추천". */
  listSiblings(parentId: string, excludeId: string, limit: number): Promise<Style[]>;
  /** Level-1 대분류 nodes, for the Category Tree / Filter Panel. */
  listCategories(): Promise<Style[]>;
}
