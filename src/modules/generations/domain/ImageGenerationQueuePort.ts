export interface EnqueueImageGenerationInput {
  generationVersionId: string;
}

/**
 * Port the application layer depends on instead of a concrete queue
 * library -- Route Handlers/Use Cases enqueue through this, never call an
 * AI provider directly (30_CLAUDE.md / Task-013's explicit mandate). The
 * real implementation wraps a BullMQ Queue (src/shared/queue); tests use
 * an in-memory fake.
 */
export interface ImageGenerationQueuePort {
  enqueue(input: EnqueueImageGenerationInput): Promise<void>;
}
