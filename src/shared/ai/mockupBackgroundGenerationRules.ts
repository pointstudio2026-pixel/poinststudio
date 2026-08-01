import type { MockupCategory } from "@/modules/mockups/domain/Mockup";

/**
 * 목업 "배경 템플릿" 생성 표준 규칙 -- 관리자 페이지의 채팅형 생성 플로우와
 * 예전 스크래치패드 배치 생성 스크립트(generate-batch3-mockups.ts 등)가
 * 공유하는 실제 코드 모듈. 이 규칙들은 memory의
 * project_aster_mockup_background_and_logo_rules.md에 기록된 살아있는
 * 규격을 그대로 코드로 옮긴 것 -- 그 문서를 수정할 때 이 파일도 함께
 * 갱신해야 한다. 실제 완성된 프로젝트 장면을 만드는 mockupRules.ts의
 * MOCKUP_CATEGORY_SCENE_TEMPLATES(로고가 이미 자리 잡은 "완성된" 목업)와는
 * 완전히 다른 관심사 -- 여기는 자리표시자 로고 마크가 들어간 "재사용
 * 가능한 빈 배경"을 만드는 쪽이다.
 */

/** 규칙 3(모양 다양성): 메뉴로 주면 모델이 첫 항목(주로 원형)에 쏠린다 --
 * 반드시 하나의 구체적 모양을 지정해서 넘겨야 한다. */
export const PLACEHOLDER_SHAPES = [
  "a circular badge",
  "a square or rounded-square badge",
  "a shield/crest shape",
  "a hexagonal badge",
  "an abstract organic blob/leaf-like shape",
  "a diamond/rhombus badge",
  "a triangular badge",
  "an abstract asymmetric geometric mark (not a regular polygon)",
] as const;

export type PlaceholderShape = (typeof PLACEHOLDER_SHAPES)[number];

/** 카테고리별 기본 장면 프레이밍. 규칙 3c(단순함) 반영: 명함/브로슈어/포스터/
 * 패키지/리플렛/배너는 스튜디오 단색 배경 + 소품 최대 1~2개, 간판은 텅 비거나
 * 최소한으로만 채워진 매장 내부. */
const SIMPLE_STUDIO_CATEGORIES = new Set<MockupCategory>([
  "business_card",
  "brochure",
  "poster",
  "package",
  "leaflet",
  "banner",
]);

export const SCENE_BY_CATEGORY: Record<MockupCategory, string> = {
  business_card:
    "A realistic studio product photograph of a business card mockup: the card resting on a plain " +
    "solid-color or near-solid-color studio backdrop, with a soft single-direction studio shadow. " +
    "The card face must show a simple placeholder logo mark printed on it, roughly centered.",
  signboard:
    "A realistic photograph of a storefront exterior with a clearly visible placeholder logo/sign " +
    "mark painted or mounted on the signboard area above the entrance. Any storefront interior " +
    "visible through glass/entrance must be EMPTY or only minimally furnished.",
  mobile_app:
    "A realistic photograph of a smartphone held in hand or on a surface, showing an app's user " +
    "interface on screen, with a placeholder app icon rendered in a slot at the top of the screen.",
  website_hero:
    "A realistic photograph of a laptop screen showing a website homepage, with a placeholder logo " +
    "mark shown in the top navigation bar.",
  brochure:
    "A realistic studio product photograph of a closed brochure or booklet mockup, cover facing " +
    "camera, resting on a plain solid-color or near-solid-color studio backdrop, with a placeholder " +
    "logo mark printed on the cover.",
  poster:
    "A realistic photograph of a poster pinned or mounted on a plain solid-color or near-solid-color " +
    "wall, with a placeholder logo mark printed near the top.",
  package:
    "A realistic studio product photograph of a product package or box mockup, resting on a plain " +
    "solid-color or near-solid-color studio backdrop, with a placeholder logo mark printed on the " +
    "label.",
  leaflet:
    "A realistic studio product photograph of a folded leaflet or flyer held in hand or resting on a " +
    "plain solid-color or near-solid-color studio backdrop, with a placeholder logo mark printed on " +
    "it.",
  banner:
    "A realistic studio product photograph of a standing banner, pennant, or storefront banner, " +
    "resting against a plain solid-color or near-solid-color backdrop, with a placeholder logo mark " +
    "printed on it.",
  uniform:
    "A realistic photograph of a uniform, apron, or work shirt on a person or mannequin, with a " +
    "placeholder logo mark embroidered on the chest.",
};

function placeholderLogoRule(shape: PlaceholderShape): string {
  return (
    `\nCRITICAL RULE #1 (logo slot): the scene MUST include a clearly visible, unmistakable ` +
    `placeholder logo mark in the location described above. Render it specifically as ${shape} -- a ` +
    `simple, generic, textless emblem/icon with absolutely NO letters, NO words, NO initials, NO ` +
    `business name written on or near it. It should look intentional and "logo-shaped" (like a real ` +
    `brand mark would look, with clean edges and deliberate placement) so it is instantly obvious ` +
    `this exact spot is a logo, not just empty space -- but it must stay entirely generic/textless ` +
    `so it can be swapped out for a real logo later. Do not leave this area blank or empty, and do ` +
    `not default to a plain circle -- use the exact shape specified above.`
  );
}

const NO_BUSINESS_NAME_RULE =
  `\nCRITICAL RULE #2 (no fake brand names): if the scene includes any OTHER typography elsewhere ` +
  `(menu boards, packaging labels, screen UI text, signage text, price tags, price lists, ` +
  `directional text, etc. -- anything other than the placeholder logo mark itself), that text must ` +
  `NEVER spell out or invent any business, brand, shop, company, or app NAME -- not a real one, not ` +
  `a made-up one like "Nexora" or "Aurora Studio". Only generic, non-branded words are allowed: menu ` +
  `item names, ingredient names, prices, simple directives (OPEN, WELCOME, SALE, MENU, HOME, SEARCH, ` +
  `CART), or purely decorative non-word patterns/textures. If in doubt, leave that area free of ` +
  `readable text entirely. The placeholder logo mark itself (rule #1) must never contain letters ` +
  `either.`;

/** 규칙 3c(단순함, 2026-07-31 결정, 배치3 이후 첫 실제 구현체 -- 배치3은
 * 이 규칙 이전에 생성돼 grandfather됨). 사용자 참고 이미지: 스튜디오
 * 단색/근단색 배경, 부드러운 단방향 그림자, 소품 거의 없음. */
function simplicityRule(category: MockupCategory): string {
  if (category === "signboard") {
    return (
      `\nCRITICAL RULE #3 (simplicity): keep the storefront interior EMPTY or only minimally ` +
      `furnished -- do not fill it with detailed furniture, products, or decor. Focus stays on the ` +
      `signboard/logo mark, not a lived-in-looking shop.`
    );
  }
  if (SIMPLE_STUDIO_CATEGORIES.has(category)) {
    return (
      `\nCRITICAL RULE #3 (simplicity): describe the scene as studio product photography on a ` +
      `plain solid or near-solid color backdrop (name one specific color), soft single-direction ` +
      `studio shadow, camera looking straight-down or at a gentle angle. At most one or two minimal ` +
      `decorative props are allowed (e.g. a single flower, a small plant, one simple object) -- do ` +
      `NOT add multiple textures, props, or an elaborately styled lifestyle scene.`
    );
  }
  return "";
}

/** 규칙 3b(업종 무관 다수). industry가 없을 때(관리자가 무드/스타일만 준
 * 경우)만 적용 -- 특정 업종을 명시했다면 이 규칙은 모순되므로 생략. */
const GENERIC_SCENE_RULE =
  `\nCRITICAL RULE #4 (industry-agnostic): do NOT tie this scene to any single specific business ` +
  `type, niche, or industry -- no industry-specific props, signage text, menu items, or décor that ` +
  `would only make sense for one particular kind of business. Keep the composition, props, and ` +
  `styling generic enough that this exact background could plausibly belong to many different kinds ` +
  `of businesses, while still strongly expressing the mood/style described below through color ` +
  `palette, materials, lighting, and composition.`;

export interface BuildMockupBackgroundPromptInput {
  category: MockupCategory;
  /** 관리자가 채팅창에 직접 쓴 자유 텍스트(무드/스타일/업종 등 무엇이든). */
  description: string;
  shape: PlaceholderShape;
  /** 참고 이미지가 함께 첨부됐는지 -- 첨부 시 문구를 살짝 조정(둘째 문장). */
  hasReferenceImage: boolean;
  /** true면 결과 사진 속 부가 텍스트를 한글로, 아니면 영어로. */
  containsKoreanText: boolean;
  /** true면 특정 업종을 명시하지 않은 무드 전용 배경으로 취급해 규칙 4를 추가. */
  isGeneric: boolean;
}

/**
 * 관리자 채팅형 생성 플로우와 배치 스크립트가 공유하는 최종 프롬프트
 * 조립 함수 -- 관리자가 어떤 자유 텍스트를 쓰든 표준 규칙(자리표시자 마크,
 * 상호명 금지, 단순함, 업종 무관)이 항상 자동으로 덧붙는다(관리자가 매번
 * 직접 타이핑할 필요 없음, memory 문서의 명시적 요구사항).
 */
export function buildMockupBackgroundPrompt(input: BuildMockupBackgroundPromptInput): string {
  const scene = SCENE_BY_CATEGORY[input.category];
  const langLine = input.containsKoreanText
    ? "Any incidental text in the scene (other than the textless placeholder logo mark) should be in Korean (Hangul), rendered accurately."
    : "Any incidental text in the scene (other than the textless placeholder logo mark) should be in English.";
  const referenceLine = input.hasReferenceImage
    ? " Use the attached reference image as inspiration for composition/mood, but do not copy any text or logo from it."
    : "";
  const genericClause = input.isGeneric ? GENERIC_SCENE_RULE : "";

  return (
    `${scene} Mood and style: ${input.description}.${referenceLine} ${langLine}` +
    `${placeholderLogoRule(input.shape)}${NO_BUSINESS_NAME_RULE}${simplicityRule(input.category)}${genericClause} ` +
    `High quality professional photography, natural lighting, realistic composition. Square 1:1 composition.`
  );
}
