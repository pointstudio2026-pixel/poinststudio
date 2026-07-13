import type { MockupCategory, MockupTemplate } from "@/modules/mockups/domain/Mockup";

export interface MockupTemplateRepository {
  list(category?: MockupCategory): Promise<MockupTemplate[]>;
  findById(id: string): Promise<MockupTemplate | null>;
  listCategories(): Promise<MockupCategory[]>;
}
