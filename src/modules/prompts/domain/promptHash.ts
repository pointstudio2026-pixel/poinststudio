import { createHash } from "node:crypto";

/**
 * "Prompt Hash 생성" / "동일 입력 시 동일 Prompt 재현": a pure function of
 * the final prompt text + provider, so re-running the pipeline with
 * unchanged Brand Brief/Strategy/Style always yields the same hash.
 */
export function computePromptHash(systemPrompt: string, userPrompt: string, provider: string): string {
  return createHash("sha256")
    .update(JSON.stringify({ systemPrompt, userPrompt, provider }))
    .digest("hex");
}
