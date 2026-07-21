import type { UserStyleReference } from "@/modules/userStyles/domain/UserStyle";

export interface UserStyleReferenceRepository {
  addToCategory(categoryId: string, storageKey: string, contentType: string): Promise<UserStyleReference>;
  listByCategoryId(categoryId: string): Promise<UserStyleReference[]>;
  findById(id: string): Promise<UserStyleReference | null>;
  deleteById(id: string): Promise<void>;
}
