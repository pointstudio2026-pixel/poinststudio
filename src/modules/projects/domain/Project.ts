export interface Project {
  id: string;
  userId: string;
  name: string;
  status: string;
  currentStep: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}
