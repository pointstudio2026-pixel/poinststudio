import type { IndustryRepository } from "@/modules/industries/domain/IndustryRepository";
import type { CreateIndustryInput, Industry, UpdateIndustryInput } from "@/modules/industries/domain/Industry";

export class FakeIndustryRepository implements IndustryRepository {
  private rows: Industry[] = [];

  seed(rows: Industry[]) {
    this.rows = rows;
  }

  async listActive(): Promise<Industry[]> {
    return this.rows.filter((r) => r.isActive).sort((a, b) => a.name.localeCompare(b.name));
  }

  async search(query: string): Promise<Industry[]> {
    const trimmed = query.trim();
    if (!trimmed) return this.listActive();
    const words = trimmed.split(/\s+/).filter(Boolean);
    return this.rows
      .filter((r) => r.isActive)
      .filter(
        (r) =>
          r.name.includes(trimmed) ||
          r.description.includes(trimmed) ||
          r.recommendedKeywords.includes(trimmed) ||
          r.recommendedKeywords.some((k) => words.includes(k)),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findByName(name: string): Promise<Industry | null> {
    return this.rows.find((r) => r.name === name) ?? null;
  }

  async findById(id: string): Promise<Industry | null> {
    return this.rows.find((r) => r.id === id) ?? null;
  }

  async listAll(): Promise<Industry[]> {
    return [...this.rows].sort((a, b) => a.name.localeCompare(b.name));
  }

  async create(input: CreateIndustryInput): Promise<Industry> {
    const now = new Date();
    const row: Industry = {
      id: crypto.randomUUID(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
      displayName: input.name,
      ...input,
    };
    this.rows.push(row);
    return row;
  }

  async update(id: string, input: UpdateIndustryInput): Promise<Industry> {
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("not found");
    const updated: Industry = { ...this.rows[idx]!, ...input, updatedAt: new Date() };
    this.rows[idx] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.rows = this.rows.filter((r) => r.id !== id);
  }
}
