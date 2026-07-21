import type {
  ProjectUserStyleSelection,
  UserStyleCategory,
  UserStyleReference,
} from "@/modules/userStyles/domain/UserStyle";
import type { UserStyleCategoryRepository } from "@/modules/userStyles/domain/UserStyleCategoryRepository";
import type { UserStyleReferenceRepository } from "@/modules/userStyles/domain/UserStyleReferenceRepository";
import type { ProjectUserStyleSelectionRepository } from "@/modules/userStyles/domain/ProjectUserStyleSelectionRepository";

export class FakeUserStyleCategoryRepository implements UserStyleCategoryRepository {
  categories: UserStyleCategory[] = [];
  private nextId = 1;

  async listByUserId(userId: string): Promise<UserStyleCategory[]> {
    return this.categories
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findById(id: string): Promise<UserStyleCategory | null> {
    return this.categories.find((c) => c.id === id) ?? null;
  }

  async create(userId: string, name: string): Promise<UserStyleCategory> {
    const category: UserStyleCategory = {
      id: `user-style-category-${this.nextId++}`,
      userId,
      name,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.categories.push(category);
    return category;
  }

  async updateDescription(id: string, description: string | null): Promise<UserStyleCategory> {
    const category = this.categories.find((c) => c.id === id);
    if (!category) throw new Error("category not found");
    category.description = description;
    category.updatedAt = new Date();
    return category;
  }

  async delete(id: string): Promise<void> {
    this.categories = this.categories.filter((c) => c.id !== id);
  }
}

export class FakeUserStyleReferenceRepository implements UserStyleReferenceRepository {
  references: UserStyleReference[] = [];
  private nextId = 1;

  async addToCategory(categoryId: string, storageKey: string, contentType: string): Promise<UserStyleReference> {
    const reference: UserStyleReference = {
      id: `user-style-reference-${this.nextId++}`,
      categoryId,
      storageKey,
      contentType,
      createdAt: new Date(),
    };
    this.references.push(reference);
    return reference;
  }

  async listByCategoryId(categoryId: string): Promise<UserStyleReference[]> {
    return this.references.filter((r) => r.categoryId === categoryId);
  }

  async findById(id: string): Promise<UserStyleReference | null> {
    return this.references.find((r) => r.id === id) ?? null;
  }

  async deleteById(id: string): Promise<void> {
    this.references = this.references.filter((r) => r.id !== id);
  }
}

export class FakeProjectUserStyleSelectionRepository implements ProjectUserStyleSelectionRepository {
  selections: ProjectUserStyleSelection[] = [];
  private nextId = 1;
  private sequence = new Map<string, number>();

  async create(projectId: string, userStyleCategoryId: string): Promise<ProjectUserStyleSelection> {
    const id = `project-user-style-selection-${this.nextId++}`;
    const selection: ProjectUserStyleSelection = { id, projectId, userStyleCategoryId, createdAt: new Date() };
    this.sequence.set(id, this.sequence.size);
    this.selections.push(selection);
    return selection;
  }

  async findLatestByProjectId(projectId: string): Promise<ProjectUserStyleSelection | null> {
    const list = this.selections
      .filter((s) => s.projectId === projectId)
      .sort((a, b) => this.sequence.get(b.id)! - this.sequence.get(a.id)!);
    return list[0] ?? null;
  }
}
