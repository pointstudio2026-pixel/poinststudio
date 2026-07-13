import type { GenerationPayload, Prompt, PromptProvider, PromptVersion } from "@/modules/prompts/domain/Prompt";

export interface PromptVersionInput {
  provider: PromptProvider;
  systemPrompt: string;
  userPrompt: string;
  hash: string;
  payload: GenerationPayload;
  flaggedTerms: string[];
}

export interface PromptRepository {
  findByProjectId(projectId: string): Promise<Prompt | null>;
  /** Creates the prompt and its first version (v1) in one step. */
  createWithFirstVersion(projectId: string, input: PromptVersionInput): Promise<Prompt>;
  /** Appends a new version and makes it current -- never overwrites a prior version. */
  addVersion(promptId: string, input: PromptVersionInput): Promise<Prompt>;
  listVersions(promptId: string): Promise<PromptVersion[]>;
}
