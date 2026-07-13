/**
 * Minimal structural port a BullMQ Queue already satisfies (its
 * getJobCounts() returns exactly this shape) -- lets GetQueueStatusUseCase
 * depend on this instead of importing bullmq's Queue type directly.
 */
export interface QueueInspectable {
  getJobCounts(...types: string[]): Promise<{
    waiting?: number;
    active?: number;
    completed?: number;
    failed?: number;
    delayed?: number;
  }>;
}
