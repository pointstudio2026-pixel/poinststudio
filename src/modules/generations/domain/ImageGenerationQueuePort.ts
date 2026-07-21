export interface EnqueueImageGenerationInput {
  generationVersionId: string;
  /** Who actually triggered this attempt (owner or team member) -- carried through the job so ProcessGenerationJobUseCase records usage/activity against the real actor, not the project owner. */
  requestedByUserId: string;
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
