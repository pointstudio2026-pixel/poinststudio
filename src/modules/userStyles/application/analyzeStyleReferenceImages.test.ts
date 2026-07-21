import { describe, expect, it } from "vitest";
import { analyzeStyleReferenceImages } from "@/modules/userStyles/application/analyzeStyleReferenceImages";
import type { TextCompletionProvider, TextCompletionRequest } from "@/shared/ai/TextCompletionProvider";

class FakeVisionProvider implements TextCompletionProvider {
  readonly name = "openai";
  lastRequest: TextCompletionRequest | null = null;
  constructor(private readonly response: { text: string } | { error: true }) {}

  async complete(request: TextCompletionRequest) {
    this.lastRequest = request;
    if ("error" in this.response) throw new Error("provider failed");
    return { text: this.response.text, provider: this.name, model: "fake-vision" };
  }

  async health() {
    return true;
  }
}

class FakeNonVisionProvider implements TextCompletionProvider {
  readonly name = "mock";
  async complete(): Promise<never> {
    throw new Error("should never be called");
  }
  async health() {
    return true;
  }
}

const IMAGES = [{ dataUri: "data:image/png;base64,AAAA", contentType: "image/png" }];

describe("analyzeStyleReferenceImages", () => {
  it("returns the provider's description and forwards image data URIs (openai)", async () => {
    const provider = new FakeVisionProvider({ text: "미니멀한 라인 아트, 파스텔 톤" });
    const result = await analyzeStyleReferenceImages(provider, IMAGES);

    expect(result).toBe("미니멀한 라인 아트, 파스텔 톤");
    expect(provider.lastRequest?.imageDataUris).toEqual(["data:image/png;base64,AAAA"]);
  });

  it("returns null without calling the provider when it doesn't support vision", async () => {
    const provider = new FakeNonVisionProvider();
    const result = await analyzeStyleReferenceImages(provider, IMAGES);
    expect(result).toBeNull();
  });

  it("returns null when there are no images", async () => {
    const provider = new FakeVisionProvider({ text: "안 불려야 함" });
    const result = await analyzeStyleReferenceImages(provider, []);
    expect(result).toBeNull();
  });

  it("returns null (not throw) when the provider call fails", async () => {
    const provider = new FakeVisionProvider({ error: true });
    const result = await analyzeStyleReferenceImages(provider, IMAGES);
    expect(result).toBeNull();
  });
});
