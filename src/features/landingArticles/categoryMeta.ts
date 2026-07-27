import type { Locale } from "@/shared/i18n/locale";

/**
 * 카테고리 타일 화면(허브 루트)에서 쓰는 카테고리별 라벨/설명. 실제로 발행된
 * 글이 있는 카테고리만 타일로 보여지므로(ArticleHubView), 여기 없는
 * 카테고리가 나중에 실제로 발행되면 raw category 문자열로 대체 표시된다
 * (fallback, 하단 getCategoryMeta 참고) -- 배포 없이도 깨지지 않는다.
 * "faq"는 이 디렉터리에 의도적으로 안 나온다(네비게이션에서 별도 진입).
 */
export interface CategoryMeta {
  label: string;
  description: string;
}

const CATEGORY_META: Record<string, Record<Locale, CategoryMeta>> = {
  style: {
    ko: { label: "스타일", description: "모던, 미니멀, 럭셔리 등 대분류 스타일별 정의와 어울리는 업종, 디테일 스펙을 확인하세요." },
    en: { label: "Style", description: "Definitions, industry fit, and detail specs for each major style — modern, minimal, luxury, and more." },
    ja: { label: "スタイル", description: "モダン、ミニマル、ラグジュアリーなど大分類スタイルごとの定義、相性の良い業種、詳細スペックをご確認ください。" },
    fr: { label: "Style", description: "Définitions, secteurs adaptés et spécifications détaillées pour chaque style majeur — moderne, minimaliste, luxe, et plus encore." },
    de: { label: "Stil", description: "Definitionen, passende Branchen und Detailspezifikationen für jeden Hauptstil — modern, minimalistisch, luxuriös und mehr." },
  },
  industry: {
    ko: { label: "업종별 가이드", description: "카페, IT 스타트업, 부동산 등 업종에 맞는 로고 디자인 방향을 확인하세요." },
    en: { label: "Industry Guides", description: "Find the right logo direction for your industry — cafés, IT startups, real estate, and more." },
    ja: { label: "業種別ガイド", description: "カフェ、ITスタートアップ、不動産など業種に合わせたロゴデザインの方向性をご確認ください。" },
    fr: { label: "Guides par secteur", description: "Trouvez la bonne direction de logo pour votre secteur — cafés, startups IT, immobilier, et plus encore." },
    de: { label: "Branchen-Guides", description: "Finden Sie die passende Logo-Richtung für Ihre Branche — Cafés, IT-Startups, Immobilien und mehr." },
  },
  "deliverable-type": {
    ko: { label: "작업물 유형별 가이드", description: "포스터, 명함, 브로슈어 등 작업물 유형에 맞는 디자인 방향을 확인하세요." },
    en: { label: "Deliverable Guides", description: "Design guidance by deliverable type — posters, business cards, brochures, and more." },
    ja: { label: "作業物タイプ別ガイド", description: "ポスター、名刺、パンフレットなど作業物タイプに合わせたデザインの方向性をご確認ください。" },
    fr: { label: "Guides par livrable", description: "Conseils de design par type de livrable — affiches, cartes de visite, brochures, et plus encore." },
    de: { label: "Guides nach Format", description: "Design-Hinweise nach Format — Poster, Visitenkarten, Broschüren und mehr." },
  },
  "style-detail": {
    ko: { label: "스타일 세부 가이드", description: "스위스, 지오메트릭 등 스타일 하위 세부 방향을 확인하세요." },
    en: { label: "Style Details", description: "Explore sub-directions within each style — Swiss, geometric, and more." },
    ja: { label: "スタイル詳細ガイド", description: "スイス、ジオメトリックなどスタイルの下位の詳細な方向性をご確認ください。" },
    fr: { label: "Détails de style", description: "Explorez les sous-directions de chaque style — suisse, géométrique, et plus encore." },
    de: { label: "Stil-Details", description: "Entdecken Sie Unterrichtungen innerhalb jedes Stils — Schweizer, geometrisch und mehr." },
  },
};

/** 메타가 없는(아직 정의 안 된) 카테고리는 raw 문자열을 그대로 라벨로 쓴다. */
export function getCategoryMeta(category: string, locale: string): CategoryMeta {
  const entry = CATEGORY_META[category];
  if (!entry) return { label: category, description: "" };
  return entry[locale as Locale] ?? entry.ko;
}
