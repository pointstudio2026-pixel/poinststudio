import type { LogoStyleCategory, LogoStyleSelection } from "@/modules/logoStyles/domain/LogoStyle";
import type { LogoStyleCategoryRepository } from "@/modules/logoStyles/domain/LogoStyleCategoryRepository";
import type { LogoStyleSelectionRepository } from "@/modules/logoStyles/domain/LogoStyleSelectionRepository";

export class FakeLogoStyleCategoryRepository implements LogoStyleCategoryRepository {
  categories: LogoStyleCategory[] = [];

  async listAll(): Promise<LogoStyleCategory[]> {
    return [...this.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findByIds(ids: string[]): Promise<LogoStyleCategory[]> {
    return this.categories.filter((c) => ids.includes(c.id));
  }
}

export class FakeLogoStyleSelectionRepository implements LogoStyleSelectionRepository {
  selections: LogoStyleSelection[] = [];
  private nextId = 1;
  private sequence = new Map<string, number>();

  async create(projectId: string, categoryIds: string[], primaryCategoryId: string): Promise<LogoStyleSelection> {
    const id = `logo-style-selection-${this.nextId++}`;
    const selection: LogoStyleSelection = { id, projectId, categoryIds, primaryCategoryId, createdAt: new Date() };
    this.sequence.set(id, this.sequence.size);
    this.selections.push(selection);
    return selection;
  }

  async findLatestByProjectId(projectId: string): Promise<LogoStyleSelection | null> {
    const list = this.selections
      .filter((s) => s.projectId === projectId)
      .sort((a, b) => this.sequence.get(b.id)! - this.sequence.get(a.id)!);
    return list[0] ?? null;
  }
}
