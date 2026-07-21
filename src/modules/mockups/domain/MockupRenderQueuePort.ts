export interface EnqueueMockupRenderInput {
  mockupId: string;
  /** Who actually triggered this render (owner or team member) -- carried through the job so ProcessMockupJobUseCase records usage/activity against the real actor, not the project owner. */
  requestedByUserId: string;
}

/** Same port pattern as ImageGenerationQueuePort/ImageEditQueuePort -- Route Handlers/Use Cases enqueue, never call a provider directly. */
export interface MockupRenderQueuePort {
  enqueue(input: EnqueueMockupRenderInput): Promise<void>;
}
