export type PromptProvider = "openai" | "gemini" | "nanobanana";

export interface PromptLayers {
  systemInstructions: string;
  brandContext: string;
  styleContext: string;
  generationObjective: string;
  safetyConstraints: string;
}

export interface GenerationPayload {
  provider: PromptProvider;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  parameters: Record<string, unknown>;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  versionNumber: number;
  provider: PromptProvider;
  systemPrompt: string;
  userPrompt: string;
  hash: string;
  payload: GenerationPayload;
  flaggedTerms: string[];
  createdAt: Date;
}

export interface Prompt {
  id: string;
  projectId: string;
  currentVersion: PromptVersion;
}
