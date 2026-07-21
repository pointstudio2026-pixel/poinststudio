import type { Style, StyleSelection } from "@/modules/styles/domain/Style";
import type { StyleListFilter, StyleRepository } from "@/modules/styles/domain/StyleRepository";
import type { StyleSelectionRepository } from "@/modules/styles/domain/StyleSelectionRepository";
import type { StyleFavoriteRepository } from "@/modules/styles/domain/StyleFavoriteRepository";

export class FakeStyleRepository implements StyleRepository {
  styles: Style[] = [];

  async list(filter: StyleListFilter): Promise<Style[]> {
    return this.styles.filter((s) => {
      if (filter.level !== undefined && s.level !== filter.level) return false;
      if (filter.category && s.category !== filter.category) return false;
      if (filter.parentId && s.parentId !== filter.parentId) return false;
      if (filter.search) {
        const term = filter.search.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(term);
        const matchesKeyword = s.keywords.some((k) => k.toLowerCase() === term);
        if (!matchesName && !matchesKeyword) return false;
      }
      return true;
    });
  }

  async findById(id: string): Promise<Style | null> {
    return this.styles.find((s) => s.id === id) ?? null;
  }

  async findByIds(ids: string[]): Promise<Style[]> {
    return this.styles.filter((s) => ids.includes(s.id));
  }

  async listSiblings(parentId: string, excludeId: string, limit: number): Promise<Style[]> {
    return this.styles.filter((s) => s.parentId === parentId && s.id !== excludeId).slice(0, limit);
  }

  async listCategories(): Promise<Style[]> {
    return this.styles.filter((s) => s.level === 1);
  }
}

export class FakeStyleSelectionRepository implements StyleSelectionRepository {
  selections: StyleSelection[] = [];
  private nextId = 1;
  private sequence = new Map<string, number>();

  async create(projectId: string, primaryStyleId: string, secondaryStyleIds: string[]): Promise<StyleSelection> {
    const id = `selection-${this.nextId++}`;
    const selection: StyleSelection = {
      id,
      projectId,
      primaryStyleId,
      secondaryStyleIds,
      createdAt: new Date(),
    };
    // Selections created within the same tick would otherwise tie on
    // createdAt -- track insertion order explicitly so "latest" is unambiguous.
    this.sequence.set(id, this.sequence.size);
    this.selections.push(selection);
    return selection;
  }

  async findLatestByProjectId(projectId: string): Promise<StyleSelection | null> {
    const list = await this.listByProjectId(projectId);
    return list[0] ?? null;
  }

  async listByProjectId(projectId: string): Promise<StyleSelection[]> {
    return this.selections
      .filter((s) => s.projectId === projectId)
      .sort((a, b) => this.sequence.get(b.id)! - this.sequence.get(a.id)!);
  }
}

export class FakeStyleFavoriteRepository implements StyleFavoriteRepository {
  favorites = new Map<string, Set<string>>();

  async add(userId: string, styleId: string): Promise<void> {
    if (!this.favorites.has(userId)) this.favorites.set(userId, new Set());
    this.favorites.get(userId)!.add(styleId);
  }

  async remove(userId: string, styleId: string): Promise<void> {
    this.favorites.get(userId)?.delete(styleId);
  }

  async listByUserId(userId: string): Promise<Style[]> {
    const ids = this.favorites.get(userId);
    if (!ids) return [];
    return [...ids].map((id) => ({
      id,
      name: id,
      slug: id,
      level: 3 as const,
      parentId: null,
      category: "unknown",
      keywords: [],
      description: "",
    }));
  }
}
