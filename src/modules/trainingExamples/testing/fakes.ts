import type { TrainingExample } from "@/modules/trainingExamples/domain/TrainingExample";
import type {
  CreateTrainingExampleInput,
  ListTrainingExampleCandidatesInput,
  TrainingExampleRepository,
} from "@/modules/trainingExamples/domain/TrainingExampleRepository";

export class FakeTrainingExampleRepository implements TrainingExampleRepository {
  examples: TrainingExample[] = [];
  private nextId = 1;

  async create(input: CreateTrainingExampleInput): Promise<TrainingExample> {
    const example: TrainingExample = {
      id: `training-example-${this.nextId++}`,
      createdAt: new Date(),
      prompt: input.prompt,
      deliverableType: input.deliverableType,
      imageStorageKey: input.imageStorageKey ?? null,
      imageContentType: input.imageContentType ?? null,
      createdByUserId: input.createdByUserId,
      evaluationScore: input.evaluationScore ?? null,
      evaluationBreakdown: input.evaluationBreakdown ?? null,
      evaluatedAt: input.evaluatedAt ?? null,
      source: input.source ?? "ADMIN",
      sourceGenerationVersionId: input.sourceGenerationVersionId ?? null,
      category: input.category ?? "이미지생성",
      industry: input.industry ?? null,
    };
    this.examples.push(example);
    return example;
  }

  async list(): Promise<TrainingExample[]> {
    // 최신순 -- 테스트 환경에서는 같은 밀리초에 여러 건이 생성될 수 있어
    // createdAt만으로는 정렬이 불안정하므로, 생성(삽입) 순서를 뒤집는다.
    return [...this.examples].reverse();
  }

  async listByDeliverableType(deliverableType: string, category?: string): Promise<TrainingExample[]> {
    return (await this.list()).filter(
      (e) => e.deliverableType === deliverableType && (!category || e.category === category),
    );
  }

  async listCandidates(input: ListTrainingExampleCandidatesInput): Promise<TrainingExample[]> {
    const matches = this.examples.filter((e) => {
      if (e.deliverableType !== input.deliverableType) return false;
      if (e.category !== input.category) return false;
      if (input.industry && e.industry && e.industry !== input.industry) return false;
      if (e.evaluationScore === null) return false;
      return input.bucket === "above" ? e.evaluationScore >= input.threshold : e.evaluationScore < input.threshold;
    });
    matches.sort((a, b) =>
      input.bucket === "above"
        ? (b.evaluationScore ?? 0) - (a.evaluationScore ?? 0)
        : (a.evaluationScore ?? 0) - (b.evaluationScore ?? 0),
    );
    return matches.slice(0, input.limit);
  }

  async findById(id: string): Promise<TrainingExample | null> {
    return this.examples.find((e) => e.id === id) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.examples = this.examples.filter((e) => e.id !== id);
  }

  async pruneAboveThreshold(threshold: number, capacity: number): Promise<number> {
    const bucket = this.examples.filter((e) => e.evaluationScore !== null && e.evaluationScore >= threshold);
    if (bucket.length <= capacity) return 0;
    const excess = bucket.length - capacity;
    const sorted = [...bucket].sort((a, b) => (a.evaluationScore ?? 0) - (b.evaluationScore ?? 0));
    const targetIds = new Set(sorted.slice(0, excess).map((e) => e.id));
    const before = this.examples.length;
    this.examples = this.examples.filter((e) => !targetIds.has(e.id));
    return before - this.examples.length;
  }

  async pruneBelowThreshold(threshold: number, capacity: number): Promise<number> {
    const bucket = this.examples.filter((e) => e.evaluationScore !== null && e.evaluationScore < threshold);
    if (bucket.length <= capacity) return 0;
    const excess = bucket.length - capacity;
    const sorted = [...bucket].sort((a, b) => (b.evaluationScore ?? 0) - (a.evaluationScore ?? 0));
    const targetIds = new Set(sorted.slice(0, excess).map((e) => e.id));
    const before = this.examples.length;
    this.examples = this.examples.filter((e) => !targetIds.has(e.id));
    return before - this.examples.length;
  }
}
