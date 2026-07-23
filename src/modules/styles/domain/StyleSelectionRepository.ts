import type { StyleSelection } from "@/modules/styles/domain/Style";

export interface StyleSelectionRepository {
  /** Selection history is append-only -- reselecting adds a new row. */
  create(
    projectId: string,
    primaryStyleId: string,
    secondaryStyleIds: string[],
    forbiddenStyleIds?: string[],
  ): Promise<StyleSelection>;
  findLatestByProjectId(projectId: string): Promise<StyleSelection | null>;
  listByProjectId(projectId: string): Promise<StyleSelection[]>;
}
