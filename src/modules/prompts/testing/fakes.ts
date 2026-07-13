import type { Prompt, PromptVersion } from "@/modules/prompts/domain/Prompt";
import type { PromptRepository, PromptVersionInput } from "@/modules/prompts/domain/PromptRepository";

export class FakePromptRepository implements PromptRepository {
  prompts = new Map<string, { id: string; projectId: string }>();
  versions: PromptVersion[] = [];
  private nextPromptId = 1;
  private nextVersionId = 1;

  async findByProjectId(projectId: string): Promise<Prompt | null> {
    const prompt = [...this.prompts.values()].find((p) => p.projectId === projectId);
    if (!prompt) return null;
    const current = this.versions
      .filter((v) => v.promptId === prompt.id)
      .sort((a, b) => b.versionNumber - a.versionNumber)[0];
    if (!current) return null;
    return { id: prompt.id, projectId: prompt.projectId, currentVersion: current };
  }

  async createWithFirstVersion(projectId: string, input: PromptVersionInput): Promise<Prompt> {
    const id = `prompt-${this.nextPromptId++}`;
    this.prompts.set(id, { id, projectId });
    const version: PromptVersion = {
      id: `prompt-version-${this.nextVersionId++}`,
      promptId: id,
      versionNumber: 1,
      ...input,
      createdAt: new Date(),
    };
    this.versions.push(version);
    return { id, projectId, currentVersion: version };
  }

  async addVersion(promptId: string, input: PromptVersionInput): Promise<Prompt> {
    const prompt = this.prompts.get(promptId);
    if (!prompt) throw new Error("prompt not found");
    const lastVersionNumber = Math.max(
      0,
      ...this.versions.filter((v) => v.promptId === promptId).map((v) => v.versionNumber),
    );
    const version: PromptVersion = {
      id: `prompt-version-${this.nextVersionId++}`,
      promptId,
      versionNumber: lastVersionNumber + 1,
      ...input,
      createdAt: new Date(),
    };
    this.versions.push(version);
    return { id: promptId, projectId: prompt.projectId, currentVersion: version };
  }

  async listVersions(promptId: string): Promise<PromptVersion[]> {
    return this.versions
      .filter((v) => v.promptId === promptId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async getVersionById(versionId: string): Promise<PromptVersion | null> {
    return this.versions.find((v) => v.id === versionId) ?? null;
  }
}
