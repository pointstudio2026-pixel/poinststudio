export interface ProjectLogoAsset {
  id: string;
  projectId: string;
  storageKey: string;
  contentType: string;
  originalFileName: string | null;
  createdAt: Date;
}
