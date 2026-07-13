import type { Style } from "@/modules/styles/domain/Style";

export interface StyleFavoriteRepository {
  /** Idempotent -- favoriting an already-favorited style is a no-op. */
  add(userId: string, styleId: string): Promise<void>;
  remove(userId: string, styleId: string): Promise<void>;
  listByUserId(userId: string): Promise<Style[]>;
}
