export interface EnqueueExportInput {
  exportId: string;
  /** Who actually triggered this export (owner or team member) -- carried through the job so ProcessExportJobUseCase records usage/activity against the real actor, not the project owner. */
  requestedByUserId: string;
}

/** Same port pattern as the other queues in this app -- Route Handlers/Use Cases enqueue, never render directly. */
export interface ExportQueuePort {
  enqueue(input: EnqueueExportInput): Promise<void>;
}
