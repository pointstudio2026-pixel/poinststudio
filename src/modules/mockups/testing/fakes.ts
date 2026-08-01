import type { MockupCategory, MockupProject, MockupTemplate } from "@/modules/mockups/domain/Mockup";
import type {
  CreateMockupInput,
  MockupRepository,
  UpdateMockupResultInput,
} from "@/modules/mockups/domain/MockupRepository";
import type { CreateMockupTemplateInput, MockupTemplateRepository } from "@/modules/mockups/domain/MockupTemplateRepository";
import type {
  EnqueueMockupRenderInput,
  MockupRenderQueuePort,
} from "@/modules/mockups/domain/MockupRenderQueuePort";
import type { StandaloneMockup } from "@/modules/mockups/domain/StandaloneMockup";
import type {
  CreateStandaloneMockupInput,
  StandaloneMockupRepository,
} from "@/modules/mockups/domain/StandaloneMockupRepository";
import type {
  ClaimGuestMockupsResult,
  GuestMockupUsageRepository,
  RecordGuestMockupUsageInput,
} from "@/modules/mockups/domain/GuestMockupUsageRepository";

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

  async search(query: string): Promise<MockupTemplate[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return this.templates;
    return this.templates.filter(
      (t) =>
        t.name.toLowerCase().includes(trimmed) ||
        t.description.toLowerCase().includes(trimmed) ||
        t.keywords.some((k) => k.toLowerCase() === trimmed),
    );
  }

  async listAll(): Promise<MockupTemplate[]> {
    return this.templates;
  }

  async create(input: CreateMockupTemplateInput): Promise<MockupTemplate> {
    const template: MockupTemplate = {
      id: `template-${this.templates.length + 1}`,
      category: input.category,
      name: input.name,
      slug: input.slug,
      description: input.description,
      backgroundUrl: input.backgroundUrl,
      placementArea: input.placementArea,
      fullDesignPlacementArea: input.fullDesignPlacementArea ?? null,
      keywords: input.keywords,
      containsKoreanText: input.containsKoreanText,
      hidden: false,
      isGeneric: input.isGeneric,
    };
    this.templates.push(template);
    return template;
  }

  async countUsages(): Promise<number> {
    return 0;
  }

  async hide(id: string): Promise<void> {
    const index = this.templates.findIndex((t) => t.id === id);
    if (index !== -1) this.templates[index] = { ...this.templates[index]!, hidden: true };
  }

  async hardDelete(id: string): Promise<void> {
    this.templates = this.templates.filter((t) => t.id !== id);
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

export class FakeStandaloneMockupRepository implements StandaloneMockupRepository {
  mockups: StandaloneMockup[] = [];
  private nextId = 1;

  async create(input: CreateStandaloneMockupInput): Promise<StandaloneMockup> {
    const mockup: StandaloneMockup = {
      id: `standalone-mockup-${this.nextId++}`,
      userId: input.userId,
      projectId: input.projectId,
      templateId: input.templateId,
      sourceType: input.sourceType,
      status: input.status,
      resultImageUrl: input.resultImageUrl ?? null,
      thumbnailUrl: input.thumbnailUrl ?? null,
      provider: input.provider ?? null,
      errorMessage: input.errorMessage ?? null,
      costAmount: input.costAmount ?? null,
      createdAt: new Date(),
    };
    this.mockups.push(mockup);
    return mockup;
  }

  async listByUserId(userId: string, limit = 50): Promise<StandaloneMockup[]> {
    return this.mockups
      .filter((m) => m.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export class FakeGuestMockupUsageRepository implements GuestMockupUsageRepository {
  records: (RecordGuestMockupUsageInput & { claimedAt: Date | null; claimedByUserId: string | null })[] = [];

  async countByGuestId(guestId: string): Promise<number> {
    return this.records.filter((r) => r.guestId === guestId).length;
  }

  async create(input: RecordGuestMockupUsageInput): Promise<void> {
    this.records.push({ ...input, claimedAt: null, claimedByUserId: null });
  }

  async claimAllForGuest(guestId: string, userId: string): Promise<ClaimGuestMockupsResult> {
    const unclaimed = this.records.filter((r) => r.guestId === guestId && r.claimedAt === null);
    for (const r of unclaimed) {
      r.claimedAt = new Date();
      r.claimedByUserId = userId;
    }
    return { claimedCount: unclaimed.length };
  }
}

export class FakeMockupRenderQueue implements MockupRenderQueuePort {
  enqueued: EnqueueMockupRenderInput[] = [];

  async enqueue(input: EnqueueMockupRenderInput): Promise<void> {
    this.enqueued.push(input);
  }
}
