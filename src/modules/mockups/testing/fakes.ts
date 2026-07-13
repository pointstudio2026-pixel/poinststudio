import type { MockupCategory, MockupProject, MockupTemplate } from "@/modules/mockups/domain/Mockup";
import type {
  CreateMockupInput,
  MockupRepository,
  UpdateMockupResultInput,
} from "@/modules/mockups/domain/MockupRepository";
import type { MockupTemplateRepository } from "@/modules/mockups/domain/MockupTemplateRepository";
import type {
  EnqueueMockupRenderInput,
  MockupRenderQueuePort,
} from "@/modules/mockups/domain/MockupRenderQueuePort";

export class FakeMockupTemplateRepository implements MockupTemplateRepository {
  templates: MockupTemplate[] = [];

  async list(category?: MockupCategory): Promise<MockupTemplate[]> {
    return category ? this.templates.filter((t) => t.category === category) : this.templates;
  }

  async findById(id: string): Promise<MockupTemplate | null> {
    return this.templates.find((t) => t.id === id) ?? null;
  }

  async listCategories(): Promise<MockupCategory[]> {
    return [...new Set(this.templates.map((t) => t.category))];
  }
}

export class FakeMockupRepository implements MockupRepository {
  mockups: MockupProject[] = [];
  private nextId = 1;

  async create(input: CreateMockupInput): Promise<MockupProject> {
    const mockup: MockupProject = {
      id: `mockup-${this.nextId++}`,
      projectId: input.projectId,
      generationVersionId: input.generationVersionId,
      sourceImageIndex: input.sourceImageIndex,
      templateId: input.templateId,
      status: "pending",
      resultImageUrl: null,
      thumbnailUrl: null,
      provider: null,
      isFavorite: false,
      errorMessage: null,
      costAmount: null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.mockups.push(mockup);
    return mockup;
  }

  async getById(id: string): Promise<MockupProject | null> {
    return this.mockups.find((m) => m.id === id) ?? null;
  }

  async updateResult(id: string, patch: UpdateMockupResultInput): Promise<MockupProject> {
    const index = this.mockups.findIndex((m) => m.id === id);
    if (index === -1) throw new Error("mockup not found");
    const current = this.mockups[index]!;
    const updated: MockupProject = {
      ...current,
      status: patch.status,
      resultImageUrl: patch.resultImageUrl ?? current.resultImageUrl,
      thumbnailUrl: patch.thumbnailUrl ?? current.thumbnailUrl,
      provider: patch.provider ?? current.provider,
      errorMessage: patch.errorMessage !== undefined ? patch.errorMessage : current.errorMessage,
      costAmount: patch.costAmount ?? current.costAmount,
      completedAt: patch.completedAt ?? current.completedAt,
    };
    this.mockups[index] = updated;
    return updated;
  }

  async setFavorite(id: string, favorite: boolean): Promise<MockupProject> {
    const index = this.mockups.findIndex((m) => m.id === id);
    if (index === -1) throw new Error("mockup not found");
    this.mockups[index] = { ...this.mockups[index]!, isFavorite: favorite };
    return this.mockups[index]!;
  }

  async delete(id: string): Promise<void> {
    this.mockups = this.mockups.filter((m) => m.id !== id);
  }

  async listByProjectId(projectId: string, category?: MockupCategory): Promise<MockupProject[]> {
    return this.mockups
      .filter((m) => m.projectId === projectId)
      .filter((m) => (category ? this.templateCategory(m.templateId) === category : true))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  templateCategoryMap = new Map<string, MockupCategory>();
  private templateCategory(templateId: string): MockupCategory | undefined {
    return this.templateCategoryMap.get(templateId);
  }
}

export class FakeMockupRenderQueue implements MockupRenderQueuePort {
  enqueued: EnqueueMockupRenderInput[] = [];

  async enqueue(input: EnqueueMockupRenderInput): Promise<void> {
    this.enqueued.push(input);
  }
}
