export interface EnqueueImageEditInput {
  editHistoryId: string;
}

/** Same port pattern as ImageGenerationQueuePort (Task-013) -- Route Handlers/Use Cases enqueue, never call a provider directly. */
export interface ImageEditQueuePort {
  enqueue(input: EnqueueImageEditInput): Promise<void>;
}
