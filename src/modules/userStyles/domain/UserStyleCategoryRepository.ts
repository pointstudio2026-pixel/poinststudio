import type { UserStyleCategory } from "@/modules/userStyles/domain/UserStyle";

export interface UserStyleCategoryRepository {
  listByUserId(userId: string): Promise<UserStyleCategory[]>;
  findById(id: string): Promise<UserStyleCategory | null>;
  create(userId: string, name: string): Promise<UserStyleCategory>;
  updateDescription(id: string, description: string | null): Promise<UserStyleCategory>;
  /** 소유자 검증은 호출부(Use Case)에서 findById로 먼저 확인한다. */
  delete(id: string): Promise<void>;
}
