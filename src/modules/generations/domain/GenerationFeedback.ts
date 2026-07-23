export interface GenerationFeedback {
  id: string;
  generationVersionId: string;
  likedTags: string[];
  dislikedTags: string[];
  freeText: string | null;
  createdAt: Date;
}

export interface SubmitGenerationFeedbackInput {
  generationVersionId: string;
  likedTags: string[];
  dislikedTags: string[];
  freeText: string | null;
}
