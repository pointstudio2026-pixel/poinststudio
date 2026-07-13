import type { EditHistoryEntry } from "@/modules/edits/domain/EditHistory";
import type {
  CreateEditHistoryInput,
  EditHistoryRepository,
  UpdateEditHistoryInput,
} from "@/modules/edits/domain/EditHistoryRepository";
import type { EnqueueImageEditInput, ImageEditQueuePort } from "@/modules/edits/domain/ImageEditQueuePort";

export class FakeEditHistoryRepository implements EditHistoryRepository {
  entries: EditHistoryEntry[] = [];
  private nextId = 1;

  async create(input: CreateEditHistoryInput): Promise<EditHistoryEntry> {
    const entry: EditHistoryEntry = {
      id: `edit-${this.nextId++}`,
      generationId: input.generationId,
      sourceVersionId: input.sourceVersionId,
      sourceImageIndex: input.sourceImageIndex,
      presetKey: input.presetKey,
      resultVersionId: input.resultVersionId,
      status: "pending",
      errorMessage: null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.entries.push(entry);
    return entry;
  }

  async getById(editId: string): Promise<EditHistoryEntry | null> {
    return this.entries.find((e) => e.id === editId) ?? null;
  }

  async update(editId: string, patch: UpdateEditHistoryInput): Promise<EditHistoryEntry> {
    const index = this.entries.findIndex((e) => e.id === editId);
    if (index === -1) throw new Error("edit entry not found");
    const current = this.entries[index]!;
    const updated: EditHistoryEntry = {
      ...current,
      status: patch.status,
      errorMessage: patch.errorMessage !== undefined ? patch.errorMessage : current.errorMessage,
      completedAt: patch.completedAt ?? current.completedAt,
    };
    this.entries[index] = updated;
    return updated;
  }

  async listByGenerationId(generationId: string): Promise<EditHistoryEntry[]> {
    return this.entries
      .filter((e) => e.generationId === generationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export class FakeImageEditQueue implements ImageEditQueuePort {
  enqueued: EnqueueImageEditInput[] = [];

  async enqueue(input: EnqueueImageEditInput): Promise<void> {
    this.enqueued.push(input);
  }
}
