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
  faqHubEyebrow: string;
  faqHubTitle: string;
  faqHubIntro: string;
  industryFitHeading: string;
  detailSpecHeading: string;
  combosHeading: string;
  faqHeading: string;
  keyPointsHeading: string;
  relatedQuestionsHeading: string;
  backToHub: string;
}

const LABELS: Record<Locale, LandingArticleLabels> = {
  ko: {
    hubEyebrow: "가이드",
    hubTitle: "활용사례 & 스타일 가이드",
    hubIntro: "스타일별 정의, 어울리는 업종, 디테일 스펙까지 -- ASTER 브랜딩 가이드를 둘러보세요.",
    hubEmpty: "아직 등록된 가이드가 없습니다.",
    faqHubEyebrow: "FAQ",
    faqHubTitle: "자주 묻는 질문",
    faqHubIntro: "ASTER에 대해 자주 묻는 질문들을 모았습니다. 궁금한 항목을 눌러 자세히 확인해보세요.",
    industryFitHeading: "어울리는 업종",
    detailSpecHeading: "디테일 스펙",
    combosHeading: "어울리는 조합",
    faqHeading: "자주 묻는 질문",
    keyPointsHeading: "핵심 요약",
    relatedQuestionsHeading: "관련 질문",
    backToHub: "가이드 목록으로",
  },
  en: {
    hubEyebrow: "Guides",
    hubTitle: "Use Cases & Style Guides",
    hubIntro: "Definitions, industry fit, and detail specs for every style -- explore the ASTER branding guides.",
    hubEmpty: "No guides published yet.",
    faqHubEyebrow: "FAQ",
    faqHubTitle: "Frequently Asked Questions",
    faqHubIntro: "Answers to common questions about ASTER. Click any question to read the full answer.",
    industryFitHeading: "Industries It Suits",
    detailSpecHeading: "Detail Spec",
    combosHeading: "Combos That Work Well",
    faqHeading: "FAQ",
    keyPointsHeading: "Key Points",
    relatedQuestionsHeading: "Related Questions",
    backToHub: "Back to guides",
  },
  ja: {
    hubEyebrow: "ガイド",
    hubTitle: "活用事例 & スタイルガイド",
    hubIntro: "スタイルごとの定義、相性の良い業種、詳細仕様まで -- ASTERのブランディングガイドをご覧ください。",
    hubEmpty: "まだ公開されたガイドがありません。",
    faqHubEyebrow: "FAQ",
    faqHubTitle: "よくある質問",
    faqHubIntro: "ASTERに関するよくある質問をまとめました。気になる質問をクリックして詳細をご確認ください。",
    industryFitHeading: "相性の良い業種",
    detailSpecHeading: "詳細スペック",
    combosHeading: "相性の良い組み合わせ",
    faqHeading: "よくある質問",
    keyPointsHeading: "ポイント要約",
    relatedQuestionsHeading: "関連する質問",
    backToHub: "ガイド一覧へ",
  },
  fr: {
    hubEyebrow: "Guides",
    hubTitle: "Cas d'usage & guides de style",
    hubIntro: "Définitions, secteurs adaptés et spécifications détaillées pour chaque style -- explorez les guides ASTER.",
    hubEmpty: "Aucun guide publié pour le moment.",
    faqHubEyebrow: "FAQ",
    faqHubTitle: "Foire aux questions",
    faqHubIntro: "Réponses aux questions courantes sur ASTER. Cliquez sur une question pour voir la réponse complète.",
    industryFitHeading: "Secteurs adaptés",
    detailSpecHeading: "Spécifications détaillées",
    combosHeading: "Combinaisons recommandées",
    faqHeading: "FAQ",
    keyPointsHeading: "Points clés",
    relatedQuestionsHeading: "Questions connexes",
    backToHub: "Retour aux guides",
  },
  de: {
    hubEyebrow: "Guides",
    hubTitle: "Anwendungsfälle & Styleguides",
    hubIntro: "Definitionen, passende Branchen und Detailspezifikationen für jeden Stil -- entdecken Sie die ASTER Branding-Guides.",
    hubEmpty: "Noch keine Guides veröffentlicht.",
    faqHubEyebrow: "FAQ",
    faqHubTitle: "Häufig gestellte Fragen",
    faqHubIntro: "Antworten auf häufige Fragen zu ASTER. Klicken Sie auf eine Frage, um die vollständige Antwort zu lesen.",
    industryFitHeading: "Passende Branchen",
    detailSpecHeading: "Detailspezifikation",
    combosHeading: "Passende Kombinationen",
    faqHeading: "FAQ",
    keyPointsHeading: "Wichtige Punkte",
    relatedQuestionsHeading: "Verwandte Fragen",
    backToHub: "Zurück zu den Guides",
  },
};

export function getLandingArticleLabels(locale: string): LandingArticleLabels {
  return LABELS[locale as Locale] ?? LABELS.ko;
}
