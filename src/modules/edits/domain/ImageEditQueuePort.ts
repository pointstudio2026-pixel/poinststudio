export interface EnqueueImageEditInput {
  editHistoryId: string;
  /** Who actually triggered this edit (owner or team member) -- carried through the job so ProcessEditJobUseCase records usage/activity against the real actor, not the project owner. */
  requestedByUserId: string;
}

/** Same port pattern as ImageGenerationQueuePort (Task-013) -- Route Handlers/Use Cases enqueue, never call a provider directly. */
export interface ImageEditQueuePort {
  enqueue(input: EnqueueImageEditInput): Promise<void>;
}
