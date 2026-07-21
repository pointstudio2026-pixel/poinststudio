export interface SavedFile {
  key: string;
  sizeBytes: number;
}

/**
 * Port the application layer depends on instead of a concrete storage
 * provider -- mirrors the Provider Adapter pattern used for AI calls
 * (25_AIProviderArchitecture.md). No real Object Storage (S3/GCS)
 * credentials are configured for this MVP, so LocalFileStorage is the
 * only implementation; swapping in a real provider later only means
 * adding a new adapter here, not touching any consumer's Use Cases
 * (Export Center render output, User Styles reference image uploads, ...).
 */
export interface FileStorage {
  save(key: string, data: Buffer, contentType: string): Promise<SavedFile>;
  read(key: string): Promise<{ data: Buffer; contentType: string } | null>;
  delete(key: string): Promise<void>;
}
