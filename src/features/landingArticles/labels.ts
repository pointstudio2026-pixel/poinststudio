import type { Locale } from "@/shared/i18n/locale";

// 가이드 페이지 UI 문구는 브라우저 쿠키 기반 앱 UI locale(LocaleProvider)이
// 아니라 URL로 결정되는 "콘텐츠 locale"을 따른다 -- 둘은 서로 다른 개념
// (예: 쿠키는 en인데 /ja/guides/... 페이지를 보는 경우도 있음)이므로
// 별도의 작은 사전을 둔다.
export interface LandingArticleLabels {
  hubEyebrow: string;
  hubTitle: string;
  hubIntro: string;
  hubEmpty: string;
  industryFitHeading: string;
  detailSpecHeading: string;
  combosHeading: string;
  faqHeading: string;
  backToHub: string;
}

const LABELS: Record<Locale, LandingArticleLabels> = {
  ko: {
    hubEyebrow: "가이드",
    hubTitle: "활용사례 & 스타일 가이드",
    hubIntro: "스타일별 정의, 어울리는 업종, 디테일 스펙까지 -- ASTER 브랜딩 가이드를 둘러보세요.",
    hubEmpty: "아직 등록된 가이드가 없습니다.",
    industryFitHeading: "어울리는 업종",
    detailSpecHeading: "디테일 스펙",
    combosHeading: "어울리는 조합",
    faqHeading: "자주 묻는 질문",
    backToHub: "가이드 목록으로",
  },
  en: {
    hubEyebrow: "Guides",
    hubTitle: "Use Cases & Style Guides",
    hubIntro: "Definitions, industry fit, and detail specs for every style -- explore the ASTER branding guides.",
    hubEmpty: "No guides published yet.",
    industryFitHeading: "Industries It Suits",
    detailSpecHeading: "Detail Spec",
    combosHeading: "Combos That Work Well",
    faqHeading: "FAQ",
    backToHub: "Back to guides",
  },
  ja: {
    hubEyebrow: "ガイド",
    hubTitle: "活用事例 & スタイルガイド",
    hubIntro: "スタイルごとの定義、相性の良い業種、詳細仕様まで -- ASTERのブランディングガイドをご覧ください。",
    hubEmpty: "まだ公開されたガイドがありません。",
    industryFitHeading: "相性の良い業種",
    detailSpecHeading: "詳細スペック",
    combosHeading: "相性の良い組み合わせ",
    faqHeading: "よくある質問",
    backToHub: "ガイド一覧へ",
  },
  fr: {
    hubEyebrow: "Guides",
    hubTitle: "Cas d'usage & guides de style",
    hubIntro: "Définitions, secteurs adaptés et spécifications détaillées pour chaque style -- explorez les guides ASTER.",
    hubEmpty: "Aucun guide publié pour le moment.",
    industryFitHeading: "Secteurs adaptés",
    detailSpecHeading: "Spécifications détaillées",
    combosHeading: "Combinaisons recommandées",
    faqHeading: "FAQ",
    backToHub: "Retour aux guides",
  },
  de: {
    hubEyebrow: "Guides",
    hubTitle: "Anwendungsfälle & Styleguides",
    hubIntro: "Definitionen, passende Branchen und Detailspezifikationen für jeden Stil -- entdecken Sie die ASTER Branding-Guides.",
    hubEmpty: "Noch keine Guides veröffentlicht.",
    industryFitHeading: "Passende Branchen",
    detailSpecHeading: "Detailspezifikation",
    combosHeading: "Passende Kombinationen",
    faqHeading: "FAQ",
    backToHub: "Zurück zu den Guides",
  },
};

export function getLandingArticleLabels(locale: string): LandingArticleLabels {
  return LABELS[locale as Locale] ?? LABELS.ko;
}
