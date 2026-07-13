export interface RecordUsageInput {
  userId: string;
  projectId?: string;
  eventType: string;
  quantity?: number;
  costAmount?: number;
  costCurrency?: string;
  metadata?: Record<string, unknown>;
}

export interface UsageRepository {
  record(input: RecordUsageInput): Promise<void>;
  countSince(userId: string, eventType: string, since: Date): Promise<number>;
}
