import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Seeds the Mockup Studio's template library (18_PRD_MockupStudio.md /
 * Task-016). Each template is a real photographic reference image (committed
 * as a static file under public/mockup-templates/, same pattern as
 * public/logo-styles) with a placement rect (in percent) where a logo gets
 * composited -- see MockMockupRenderProvider. Placement values are initial
 * eyeballed estimates; adjust after a real render if a logo doesn't sit
 * naturally. Re-run with `npm run prisma:seed-mockup-templates`; it upserts
 * by slug, so existing rows keep their id (mockup_projects references stay
 * valid) and just get their values refreshed.
 *
 * 중요(2026-07-30): 로고 배치 영역이 아닌 곳의 타이포에는 업체명/브랜드명을
 * 절대 포함하지 않는다(실제든 가짜 placeholder든). 사용자가 자기 로고를
 * 합성하면 배경에 적힌 상호명과 로고의 실제 상호명이 달라 보이는 문제가
 * 생긴다 -- 자세한 배경은 prisma/seedMockupExamples.ts의 2026-07-30 코멘트
 * 참고. 같은 코멘트에 로고 자리 자체를 글자 없는 placeholder 마크로 명확히
 * 그려 넣어야 한다는 규칙도 함께 있음 -- placement 좌표만 잡아두고 배경
 * 이미지 자체는 빈 공간으로 두면 안 된다.
 */

interface PlacementRect {
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}

interface TemplateDef {
  category: string;
  name: string;
  slug: string;
  description: string;
  imagePath: string;
  placement: PlacementRect;
  /** 완성된 결과물 전체(포스터/브로슈어 등)를 크게 합성할 영역 -- DELIVERABLE_TYPE_TO_MOCKUP_CATEGORY에 매핑된 카테고리만 채운다. */
  fullDesignPlacement?: PlacementRect;
  /** 목업 단독 프로세스의 배경 검색용 키워드(동의어/업종 시소러스). */
  keywords: string[];
  /** 배경 사진에 로고 배치 영역이 아닌 곳에 업체명이 박혀 있어 목록/검색에서
   * 숨겨야 하지만(2026-07-30 감사), 실사용 참조가 있어 행을 지울 수는
   * 없는 템플릿. 대체 이미지가 준비되면 이 플래그를 지우고 imagePath를
   * 교체할 것. */
  hidden?: boolean;
}

const TEMPLATES: TemplateDef[] = [
  {
    category: "business_card",
    name: "명함",
    slug: "business-card",
    description: "명함 목업 템플릿 -- 카드 앞면에 로고를 자동 배치합니다.",
    imagePath: "/mockup-templates/business-card.jpg",
    placement: { xPct: 32, yPct: 22, widthPct: 20, heightPct: 20 },
    fullDesignPlacement: { xPct: 14, yPct: 12, widthPct: 56, heightPct: 60 },
    keywords: ["명함","비즈니스카드","카드","네임카드","business card","name card","calling card","visiting card","contact card","名刺","ビジネスカード","ネームカード","カード","名刺デザイン","carte de visite","carte professionnelle","carte d'affaires","carte","Visitenkarte","Geschäftskarte","Namenskarte","Kontaktkarte","Karte"],
    hidden: true,
  },
  {
    category: "signboard",
    name: "간판",
    slug: "signboard",
    description: "간판 목업 템플릿 -- 매장 사인에 로고를 자동 배치합니다.",
    imagePath: "/mockup-templates/signboard.jpg",
    placement: { xPct: 41, yPct: 20, widthPct: 30, heightPct: 38 },
    keywords: ["간판","매장","상점","숍","외관","매장 외관","signboard","shop sign","storefront","store sign","shopfront","看板","店舗","ショップ","店頭","外観","enseigne","devanture","magasin","boutique","façade","Ladenschild","Schild","Ladenfront","Schaufenster","Geschäft"],
    hidden: true,
  },
  {
    category: "mobile_app",
    name: "모바일 앱",
    slug: "mobile-app",
    description: "모바일 앱 목업 템플릿 -- 앱 화면에 로고를 자동 배치합니다.",
    imagePath: "/mockup-templates/mobile-app.jpg",
    placement: { xPct: 40, yPct: 18, widthPct: 8, heightPct: 8 },
    fullDesignPlacement: { xPct: 20, yPct: 17, widthPct: 22, heightPct: 56 },
    keywords: ["모바일 앱","앱","어플","스마트폰","휴대폰","mobile app","app","smartphone","phone screen","mobile","モバイルアプリ","アプリ","スマホ","スマートフォン","携帯","application mobile","appli","téléphone","écran mobile","mobile App","Handy","Anwendung","Smartphone-App"],
    // 2026-07-31: 폰 2대가 나란히 나오는 구도라 로고 자리가 명확하지 않고
    // (로고 규칙 #1 위반), 그마저도 어느 화면이 로고 자리인지 애매해서 숨김.
    hidden: true,
  },
  {
    category: "website_hero",
    name: "웹사이트",
    slug: "website-hero",
    description: "웹사이트 목업 템플릿 -- 내비게이션 바에 로고를 자동 배치합니다.",
    imagePath: "/mockup-templates/website-hero.jpg",
    placement: { xPct: 9, yPct: 12, widthPct: 12, heightPct: 5 },
    fullDesignPlacement: { xPct: 8, yPct: 19, widthPct: 55, heightPct: 56 },
    keywords: ["웹사이트","홈페이지","웹","사이트","노트북","온라인","website","homepage","web page","laptop","online","landing page","ウェブサイト","ホームページ","サイト","ノートパソコン","オンライン","site web","site internet","page d'accueil","ordinateur portable","en ligne","Webseite","Homepage","Website","Laptop","Startseite"],
    hidden: true,
  },
  {
    category: "brochure",
    name: "브로슈어",
    slug: "brochure",
    description: "브로슈어 목업 템플릿 -- 표지에 로고를 자동 배치합니다.",
    imagePath: "/mockup-templates/brochure.jpg",
    placement: { xPct: 66, yPct: 16, widthPct: 26, heightPct: 12 },
    fullDesignPlacement: { xPct: 58, yPct: 8, widthPct: 38, heightPct: 82 },
    keywords: ["브로슈어","카탈로그","팜플렛","소개서","brochure","catalog","catalogue","pamphlet","booklet","company profile","パンフレット","ブローシャー","カタログ","会社案内","冊子","dépliant","plaquette","livret","catalogue d'entreprise","Broschüre","Katalog","Prospekt","Firmenbroschüre","Werbeheft"],
    hidden: true,
  },
  // poster-medical / poster-cafe: 2026-07-30 감사에서 배경에 업체명이 박혀
  // 있고 실사용 참조가 없어 DB에서 완전히 삭제했다 -- 재실행해도 다시
  // 만들어지지 않도록 여기서도 제거.
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // deleteMany+create은 mockup_projects가 실제로 이 템플릿들을 참조하기
  // 시작한 뒤로는 FK RESTRICT에 막힌다(운영에 실사용 데이터가 쌓인 뒤 처음
  // 발견됨) -- slug 기준 upsert로 바꿔서 기존 행은 자리를 지키며 값만
  // 갱신되게 한다(TEMPLATES에서 빠진 slug가 있어도 그 행은 그대로 둔다).
  for (const t of TEMPLATES) {
    const data = {
      category: t.category,
      name: t.name,
      description: t.description,
      backgroundUrl: t.imagePath,
      keywords: t.keywords,
      placementXPct: t.placement.xPct,
      placementYPct: t.placement.yPct,
      placementWidthPct: t.placement.widthPct,
      placementHeightPct: t.placement.heightPct,
      fullDesignPlacementXPct: t.fullDesignPlacement?.xPct,
      fullDesignPlacementYPct: t.fullDesignPlacement?.yPct,
      fullDesignPlacementWidthPct: t.fullDesignPlacement?.widthPct,
      fullDesignPlacementHeightPct: t.fullDesignPlacement?.heightPct,
      hidden: t.hidden ?? false,
    };
    await prisma.mockupTemplate.upsert({
      where: { slug: t.slug },
      create: { slug: t.slug, ...data },
      update: data,
    });
  }

  const categoryCount = new Set(TEMPLATES.map((t) => t.category)).size;
  console.log(`Seeded mockup templates: ${TEMPLATES.length} across ${categoryCount} categories`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
