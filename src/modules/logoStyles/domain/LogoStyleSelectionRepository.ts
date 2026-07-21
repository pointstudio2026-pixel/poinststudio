import type { LogoStyleSelection } from "@/modules/logoStyles/domain/LogoStyle";

export interface LogoStyleSelectionRepository {
  /** Selection history is append-only -- reselecting adds a new row. */
  create(projectId: string, categoryIds: string[], primaryCategoryId: string): Promise<LogoStyleSelection>;
  findLatestByProjectId(projectId: string): Promise<LogoStyleSelection | null>;
}
