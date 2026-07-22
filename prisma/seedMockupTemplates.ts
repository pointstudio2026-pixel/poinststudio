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
  },
  {
    category: "signboard",
    name: "간판",
    slug: "signboard",
    description: "간판 목업 템플릿 -- 매장 사인에 로고를 자동 배치합니다.",
    imagePath: "/mockup-templates/signboard.jpg",
    placement: { xPct: 41, yPct: 20, widthPct: 30, heightPct: 38 },
  },
  {
    category: "mobile_app",
    name: "모바일 앱",
    slug: "mobile-app",
    description: "모바일 앱 목업 템플릿 -- 앱 화면에 로고를 자동 배치합니다.",
    imagePath: "/mockup-templates/mobile-app.jpg",
    placement: { xPct: 40, yPct: 18, widthPct: 8, heightPct: 8 },
    fullDesignPlacement: { xPct: 20, yPct: 17, widthPct: 22, heightPct: 56 },
  },
  {
    category: "website_hero",
    name: "웹사이트",
    slug: "website-hero",
    description: "웹사이트 목업 템플릿 -- 내비게이션 바에 로고를 자동 배치합니다.",
    imagePath: "/mockup-templates/website-hero.jpg",
    placement: { xPct: 9, yPct: 12, widthPct: 12, heightPct: 5 },
    fullDesignPlacement: { xPct: 8, yPct: 19, widthPct: 55, heightPct: 56 },
  },
  {
    category: "brochure",
    name: "브로슈어",
    slug: "brochure",
    description: "브로슈어 목업 템플릿 -- 표지에 로고를 자동 배치합니다.",
    imagePath: "/mockup-templates/brochure.jpg",
    placement: { xPct: 66, yPct: 16, widthPct: 26, heightPct: 12 },
    fullDesignPlacement: { xPct: 58, yPct: 8, widthPct: 38, heightPct: 82 },
  },
  {
    category: "poster",
    name: "포스터 (메디컬)",
    slug: "poster-medical",
    description: "포스터 목업 템플릿 -- 상단 브랜드 영역에 로고를 자동 배치합니다.",
    imagePath: "/mockup-templates/poster-medical.jpg",
    placement: { xPct: 28, yPct: 10, widthPct: 44, heightPct: 6 },
    fullDesignPlacement: { xPct: 23, yPct: 8, widthPct: 60, heightPct: 82 },
  },
  {
    category: "poster",
    name: "포스터 (카페)",
    slug: "poster-cafe",
    description: "포스터 목업 템플릿 -- 상단 브랜드 영역에 로고를 자동 배치합니다.",
    imagePath: "/mockup-templates/poster-cafe.jpg",
    placement: { xPct: 43, yPct: 11, widthPct: 35, heightPct: 18 },
    fullDesignPlacement: { xPct: 36, yPct: 2, widthPct: 46, heightPct: 82 },
  },
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
      placementXPct: t.placement.xPct,
      placementYPct: t.placement.yPct,
      placementWidthPct: t.placement.widthPct,
      placementHeightPct: t.placement.heightPct,
      fullDesignPlacementXPct: t.fullDesignPlacement?.xPct,
      fullDesignPlacementYPct: t.fullDesignPlacement?.yPct,
      fullDesignPlacementWidthPct: t.fullDesignPlacement?.widthPct,
      fullDesignPlacementHeightPct: t.fullDesignPlacement?.heightPct,
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
