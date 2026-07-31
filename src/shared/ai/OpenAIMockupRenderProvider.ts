import type {
  MockupRenderProvider,
  MockupRenderRequest,
  MockupRenderResult,
} from "@/shared/ai/MockupRenderProvider";
import { resolveBackgroundDataUri, resolveImageBuffer } from "@/shared/ai/mockupAssets";
import { checkLogoBackgroundContrast, type LogoContrastCheckResult } from "@/shared/ai/logoContrastCheck";
import { ProviderError } from "@/shared/errors/AppError";
import { logger } from "@/shared/logging/logger";
import { isHealthEndpointReachable } from "@/shared/ai/providerHealthCheck";
import { MOCKUP_CATEGORIES } from "@/modules/mockups/domain/Mockup";
import { buildMockupCategorySceneDirective } from "@/modules/mockups/domain/mockupRules";

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
// 2026-07-31 사용자 지적: 로고가 배경에 묻힐 때 무조건 흰색/검정으로
// 바꾸면 "센스 없이" 튀어 보인다 -- 예를 들어 검정 글씨 로고를 어두운
// 금색 트림 간판에 합성할 때는 그 간판의 실제 금색/베이지 톤으로
// 바뀌는 게 자연스럽다. checkLogoBackgroundContrast가 배경 사진에서
// 실제로 쓰인 강조색을 픽셀 단위로 찾아주므로(sharp, AI 비용 없음),
// 그 강조색이 있으면 흰/검 대신 그 색을 구체적으로(HEX) 지정한다 --
// 강조색이 없는 배경에서만 흰/검 최후 수단으로 폴백.
function buildContrastClause(contrastCheck: LogoContrastCheckResult | null): string {
  if (!contrastCheck?.needsAdjustment || !contrastCheck.recommendedTone) return "";
  const tone = contrastCheck.recommendedTone;
  const toneKo =
    tone.kind === "accent"
      ? `이 배경 사진에 실제로 쓰인 강조색(HEX ${tone.hex} 계열의 톤)`
      : tone.kind === "white"
        ? "흰색 단색"
        : "검정색 단색";
  return (
    ` 다만 로고 색상이 배경과 명도 대비가 부족해 로고가 배경 속에 묻혀 잘 안 보일 ` +
    `수 있습니다 -- 이 경우에 한해 로고의 형태·텍스트·구성 비율은 절대 바꾸지 말고, ` +
    `가독성을 위해 로고의 색상만 ${toneKo}으로 바꿔서 배경 위에서 또렷하게 보이도록 ` +
    `해주세요.`
  );
}

// 2026-07-29 사용자 지적: (1) 기존 자리표시자 로고가 심볼+타이포로 이루어져
// 있는데 심볼만 바뀌고 기존 타이포가 남거나 새 로고 텍스트가 기존 텍스트와
// 겹쳐 보이는 문제, (2) 로고가 자리에 비해 너무 크게 들어가는 경향(여백
// 부족) -- 둘 다 "로고를 자리표시자 자리에 배치/교체"라는 지시만으로는
// 모델이 부분 교체나 과대 배치를 할 수 있어 명시적으로 못박는다.
// 2026-07-31 사용자 지적/발견 2건, 같은 근본 원인:
// (a) 카페 바리스타 앞치마 목업 -- 실제 로고가 아이콘+워드마크+태그라인
//     조합(lockup)인데 "자리표시자 크기 그대로" 지시를 전체 조합에
//     적용하니 자리표시자보다 아래로 넘쳐서 포켓 재봉선을 침범.
// (b) 미니멀 매장 간판 목업 -- 자리표시자가 작은 원형 배지 하나뿐인데
//     사용자가 가로로 긴 워드마크형 로고를 넣으면, 그 작은 원 지름
//     안에 다 욱여넣어야 해서 글자 높이가 비현실적으로 작아짐.
// 두 경우 다 "로고 크기 = 자리표시자 마크 자체의 크기"를 기준으로 삼은
// 게 원인 -- 자리표시자 마크는 저희 생성 규칙상 일부러 작고 단순하게
// 그려지는데, 실제 그 마크가 놓인 표면(간판 판넬, 앞치마 가슴판 전체,
// 명함 앞면 등)은 그보다 넓다. 그래서 기준을 마크 자체가 아니라 그
// 마크가 놓인 실제 표면으로 바꾼다: 새 로고의 형태(가로로 긴 워드마크,
// 세로로 긴 조합 등)가 자리표시자 마크와 비슷하면 마크 크기를 그대로
// 따르고, 형태가 다르면 그 표면 안에서 자연스러운 크기로 채우되 표면의
// 실제 경계(포켓 재봉선, 판넬 테두리, 카드 가장자리 등)는 절대 넘지
// 않는다. 가독성을 이유로 이 상한을 넘겨서 키우는 보정은 넣지 않는다
// (사용자 지적: 가독성 여부는 시스템이 아니라 사용자가 직접 판단할
// 영역).
const LOGO_REPLACEMENT_QUALITY_CLAUSE =
  ` 기존 자리표시자 로고가 심볼(아이콘)과 타이포그래피(브랜드명 워드마크)가 ` +
  `함께 있는 형태라면, 심볼만 바꾸고 기존 타이포그래피를 그대로 남겨두거나 ` +
  `새 로고를 기존 타이포그래피 위에 겹쳐 그리면 절대 안 됩니다 -- 심볼과 ` +
  `타이포그래피를 포함한 로고 전체를 하나의 통짜 단위로 완전히 들어내고 ` +
  `첨부된 로고로 통째로 교체해야 합니다. 새 로고는 원래 자리표시자가 ` +
  `있던 바로 그 자리를 중심으로 배치하세요. 크기는 다음 기준을 따르세요: ` +
  `첨부된 실제 로고의 전체 형태(가로세로 비율)가 원래 자리표시자 마크와 ` +
  `비슷하다면(예: 둘 다 아이콘 하나로 컴팩트한 형태) 자리표시자 마크의 ` +
  `크기를 그대로 넘지 않게 맞추세요. 하지만 실제 로고가 자리표시자 ` +
  `마크와 형태가 많이 다르다면(예: 자리표시자는 작은 원형/사각형 아이콘 ` +
  `하나뿐인데 실제 로고는 가로로 긴 워드마크이거나, 아이콘+브랜드명+` +
  `태그라인이 세로로 쌓인 조합인 경우), 자리표시자 마크 자체의 좁은 ` +
  `크기에 억지로 맞추지 말고, 그 마크가 놓여 있는 실제 표면 전체(간판 ` +
  `판넬, 앞치마나 유니폼의 가슴판/상반신 앞면 전체, 명함이나 라벨의 ` +
  `앞면 전체 등)를 기준으로 자연스럽고 비례에 맞는 크기로 배치하세요. ` +
  `단, 어느 경우든 그 표면의 실제 물리적 경계(포켓 윗단 재봉선, 옷깃, ` +
  `간판 판넬 테두리, 카드나 라벨의 가장자리, 인쇄된 다른 문구나 그림 ` +
  `등)를 침범하거나 넘어가면 절대 안 됩니다 -- 특히 앞치마·유니폼처럼 ` +
  `포켓이나 재봉선이 있는 경우, 로고(워드마크·태그라인 포함 전체)가 ` +
  `그 재봉선에 닿거나 넘어가지 않도록 재봉선 위 공간 안에서만 배치하고, ` +
  `필요하면 로고 전체를 비율 그대로 축소해서라도 재봉선을 넘지 않게 ` +
  `하세요. 가독성을 이유로 이 경계보다 크게 그리면 안 됩니다.`;

function buildPrompt(request: MockupRenderRequest, contrastCheck: LogoContrastCheckResult | null): string {
  const base =
    request.compositingMode === "fullDesign"
      ? `첨부된 두 이미지 중 첫 번째(디자인 시안)를 다시 그리거나 새로 해석하지 말고 ` +
        `정확히 그대로, ${request.templateName} 목업의 해당 영역에 자연스럽게 합성한 ` +
        `사실적인 사진을 만들어줘. 시안에 있는 모든 텍스트, 레이아웃, 색상, 로고를 ` +
        `완전히 동일하게 유지해줘 -- 문구나 심볼을 새로 만들어내면 안 돼.`
      : request.isStandalone
        ? `첨부된 두 이미지 중 첫 번째(브랜드 로고)를 다시 그리거나 새로 해석하지 말고 ` +
          `정확히 그대로, 두 번째 이미지(배경)에 자연스럽게 배치한 사실적인 제품 사진을 ` +
          `만들어줘. 로고의 텍스트, 심볼, 색상을 완전히 동일하게 유지해줘. 배경 이미지에 ` +
          `이미 있는 모든 요소(구도, 소품, 배경에 인쇄/표시된 문구나 이미지, 조명, 톤) ` +
          `그대로 유지하고 절대 새로 만들거나 바꾸거나 지우지 마 -- 로고가 들어갈 자리 ` +
          `(빈 자리, 또는 이미 있는 자리표시자 로고/워드마크)가 배경 안에 여러 군데 ` +
          `보인다면(예: 명함의 앞면과 뒷면, 간판의 여러 면, 서로 다른 소품 위 등) 그 ` +
          `자리 전부에 빠짐없이 동일한 이 로고를 배치해줘 -- 한 군데만 채우고 나머지를 ` +
          `빈 자리나 기존 자리표시자 그대로 남겨두면 안 돼. 각 자리에 넣는 로고 크기는 ` +
          `그 자리가 원래 차지하고 있던 크기·비율을 그대로 따라야 해 -- 원래 작았던 ` +
          `자리에 과도하게 크게 그리거나, 원래 컸던 자리에 작게 그리면 안 돼. 그 외에는 ` +
          `배경을 그대로 재현해줘. 같은 배경 이미지로 다시 합성해도 매번 동일한 장면이 ` +
          `나와야 해 -- 배경의 내용을 임의로 새로 지어내면 안 돼.`
        : `첨부된 두 이미지 중 첫 번째(브랜드 로고)를 다시 그리거나 새로 해석하지 말고 ` +
          `정확히 그대로, ${request.templateName} 목업에 자연스럽게 배치한 사실적인 제품 ` +
          `사진을 만들어줘. 로고의 텍스트, 심볼, 색상을 완전히 동일하게 유지하고, 배경과 ` +
          `소품은 실제 사용 환경처럼 유지해줘. 로고 하나만 텅 빈 배경 위에 덩그러니 놓인 ` +
          `초라한 결과물이 되면 안 돼 -- ${request.templateName}이 실제로 완성되어 사용되고 ` +
          `있는 것처럼, 그 결과물 종류에 맞는 그럴듯한 내용(문구/이미지/UI 요소 등)으로 ` +
          `화면 또는 지면을 채운 완성도 있는 장면으로 표현해줘. 로고가 들어갈 자리가 ` +
          `여러 군데(예: 앞면과 뒷면 등) 보인다면 그 자리 전부에 빠짐없이 동일한 이 ` +
          `로고를 각 자리의 원래 크기·비율에 맞게 배치해줘.`;
  // 단독 목업 프로세스는 배경 사진 자체가 이미 완성된 장면이라(위에서 "그대로
  // 보존" 지침을 줬다), 카테고리별 일반 연출 지침을 더 얹으면 실제 사진과
  // 안 맞는 지시가 섞여 오히려 일관성을 해친다 -- 프로젝트 흐름(빈 배경에
  // 매번 새로 장면을 지어내야 함)에서만 적용한다.
  const isKnownCategory = (MOCKUP_CATEGORIES as readonly string[]).includes(request.category);
  const sceneDirective =
    isKnownCategory && !request.isStandalone
      ? buildMockupCategorySceneDirective(request.category as (typeof MOCKUP_CATEGORIES)[number], request.industry)
      : "";
  const sceneClause = sceneDirective ? ` 연출 지침: ${sceneDirective}` : "";
  const styleClause = request.styleCategory ? ` 스타일 표현 방식: ${request.styleCategory}` : "";
  const referenceClause = request.referenceExampleText ? ` 참고 연출 가이드: ${request.referenceExampleText}` : "";
  const avoidClause = request.avoidPatternText ? ` 회피 지침(과거에 반응이 좋지 않았던 연출, 피할 것): ${request.avoidPatternText}` : "";
  // 완성된 디자인 시안(fullDesign)은 이미 그 자체의 색상 체계·크기로 완성된
  // 결과물이라 대비 보정이나 여백 지침 대상이 아니다 -- 순수 로고 마크 하나만
  // 배치하는 두 모드에서만 적용.
  const isLogoOnlyMode = request.compositingMode !== "fullDesign";
  const contrastClause = isLogoOnlyMode ? buildContrastClause(contrastCheck) : "";
  const replacementQualityClause = isLogoOnlyMode ? LOGO_REPLACEMENT_QUALITY_CLAUSE : "";
  return `${base}${sceneClause}${styleClause}${referenceClause}${avoidClause}${contrastClause}${replacementQualityClause}`;
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
    const contrastCheck = await checkLogoBackgroundContrast(design.buffer, background.buffer, request.placementArea);

    const form = new FormData();
    form.append("model", this.model);
    form.append("prompt", buildPrompt(request, contrastCheck));
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
