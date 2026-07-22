import type {
  MockupRenderProvider,
  MockupRenderRequest,
  MockupRenderResult,
} from "@/shared/ai/MockupRenderProvider";
import { resolveBackgroundDataUri, resolveImageBuffer } from "@/shared/ai/mockupAssets";
import { ProviderError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logging/logger";
import { isHealthEndpointReachable } from "@/shared/ai/providerHealthCheck";

const OPENAI_EDITS_URL = "https://api.openai.com/v1/images/edits";
const OPENAI_MODELS_URL = "https://api.openai.com/v1/models";
// gpt-image-2 at "medium" quality (사용자 요청) -- note this model requires
// the OpenAI org to have completed API Organization Verification; if it
// hasn't, calls will fail until that's done.
const DEFAULT_MODEL = "gpt-image-2";
const DEFAULT_QUALITY = "medium";
// ~$0.053/image at medium quality, 1024x1024 (third-party pricing trackers,
// not confirmed against OpenAI's own pricing page directly -- re-check if
// this needs to be billing-accurate rather than a rough usage estimate).
const ESTIMATED_COST_PER_IMAGE_USD = 0.053;

/**
 * `/v1/images/edits` (multipart, `image[]` up to 16 real image files) actually
 * references the attached pixels, unlike `/v1/images/generations`'s pure
 * text->image path this used to call -- that's what makes the real logo/design
 * show up unchanged instead of a reimagined one. gpt-image-2 has no
 * `input_fidelity` param (it always processes inputs at high fidelity), but
 * OpenAI's own docs note exact brand marks aren't pixel-guaranteed, so the
 * prompt still explicitly repeats "keep it exactly as attached, don't redraw".
 * `image[]` order: [design/logo image, template background] (매핑된
 * 순서 -- 첫 번째가 실제 참조해야 할 대상, 두 번째가 합성될 배경).
 */
function buildPrompt(request: MockupRenderRequest): string {
  if (request.compositingMode === "fullDesign") {
    return (
      `첨부된 두 이미지 중 첫 번째(디자인 시안)를 다시 그리거나 새로 해석하지 말고 ` +
      `정확히 그대로, ${request.templateName} 목업의 해당 영역에 자연스럽게 합성한 ` +
      `사실적인 사진을 만들어줘. 시안에 있는 모든 텍스트, 레이아웃, 색상, 로고를 ` +
      `완전히 동일하게 유지해줘 -- 문구나 심볼을 새로 만들어내면 안 돼.`
    );
  }
  return (
    `첨부된 두 이미지 중 첫 번째(브랜드 로고)를 다시 그리거나 새로 해석하지 말고 ` +
    `정확히 그대로, ${request.templateName} 목업에 자연스럽게 배치한 사실적인 제품 ` +
    `사진을 만들어줘. 로고의 텍스트, 심볼, 색상을 완전히 동일하게 유지하고, 배경과 ` +
    `소품은 실제 사용 환경처럼 유지해줘.`
  );
}

export class OpenAIMockupRenderProvider implements MockupRenderProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async render(request: MockupRenderRequest): Promise<MockupRenderResult> {
    const design = await resolveImageBuffer(request.logoImageUrl);
    const background = await resolveImageBuffer(await resolveBackgroundDataUri(request.backgroundUrl));

    const form = new FormData();
    form.append("model", this.model);
    form.append("prompt", buildPrompt(request));
    form.append("quality", DEFAULT_QUALITY);
    form.append("size", "1024x1024");
    form.append("image[]", new Blob([new Uint8Array(design.buffer)], { type: design.mimeType }), "design.png");
    form.append(
      "image[]",
      new Blob([new Uint8Array(background.buffer)], { type: background.mimeType }),
      "background.png",
    );

    const start = Date.now();
    const res = await fetch(OPENAI_EDITS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error("OpenAI mockup render failed", {
        provider: this.name,
        model: this.model,
        status: res.status,
        duration: Date.now() - start,
        body,
      });
      throw new ProviderError(`OpenAI 목업 렌더링 요청이 실패했습니다 (${res.status})`, { body });
    }

    const json = (await res.json()) as { data?: { url?: string; b64_json?: string }[] };
    const entry = json.data?.[0];
    const url = entry?.url ?? (entry?.b64_json ? `data:image/png;base64,${entry.b64_json}` : undefined);
    if (!url) {
      throw new ProviderError("OpenAI 응답에서 이미지 데이터를 찾을 수 없습니다.");
    }

    return { imageUrl: url, thumbnailUrl: url, provider: this.name, costAmount: ESTIMATED_COST_PER_IMAGE_USD };
  }

  async health(): Promise<boolean> {
    return isHealthEndpointReachable(`${OPENAI_MODELS_URL}/${this.model}`, {
      Authorization: `Bearer ${this.apiKey}`,
    });
  }
}
