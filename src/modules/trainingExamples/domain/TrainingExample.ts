export interface TrainingExample {
  id: string;
  prompt: string;
  deliverableType: string;
  imageStorageKey: string;
  imageContentType: string;
  createdByUserId: string;
  createdAt: Date;
}
