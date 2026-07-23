import type { TrainingExample } from "@/modules/trainingExamples/domain/TrainingExample";
import type {
  CreateTrainingExampleInput,
  TrainingExampleRepository,
} from "@/modules/trainingExamples/domain/TrainingExampleRepository";

export class FakeTrainingExampleRepository implements TrainingExampleRepository {
  examples: TrainingExample[] = [];
  private nextId = 1;

  async create(input: CreateTrainingExampleInput): Promise<TrainingExample> {
    const example: TrainingExample = {
      id: `training-example-${this.nextId++}`,
      createdAt: new Date(),
      ...input,
    };
    this.examples.push(example);
    return example;
  }

  async list(): Promise<TrainingExample[]> {
    // 최신순 -- 테스트 환경에서는 같은 밀리초에 여러 건이 생성될 수 있어
    // createdAt만으로는 정렬이 불안정하므로, 생성(삽입) 순서를 뒤집는다.
    return [...this.examples].reverse();
  }

  async listByDeliverableType(deliverableType: string): Promise<TrainingExample[]> {
    return (await this.list()).filter((e) => e.deliverableType === deliverableType);
  }

  async findById(id: string): Promise<TrainingExample | null> {
    return this.examples.find((e) => e.id === id) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.examples = this.examples.filter((e) => e.id !== id);
  }
}
