export interface EnqueueExportInput {
  exportId: string;
}

/** Same port pattern as the other queues in this app -- Route Handlers/Use Cases enqueue, never render directly. */
export interface ExportQueuePort {
  enqueue(input: EnqueueExportInput): Promise<void>;
}
