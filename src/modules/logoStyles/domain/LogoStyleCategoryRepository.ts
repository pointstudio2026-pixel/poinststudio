import type { LogoStyleCategory } from "@/modules/logoStyles/domain/LogoStyle";

export interface LogoStyleCategoryRepository {
  listAll(): Promise<LogoStyleCategory[]>;
  findByIds(ids: string[]): Promise<LogoStyleCategory[]>;
}
