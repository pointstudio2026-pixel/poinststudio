export interface EnqueueMockupRenderInput {
  mockupId: string;
}

/** Same port pattern as ImageGenerationQueuePort/ImageEditQueuePort -- Route Handlers/Use Cases enqueue, never call a provider directly. */
export interface MockupRenderQueuePort {
  enqueue(input: EnqueueMockupRenderInput): Promise<void>;
}
