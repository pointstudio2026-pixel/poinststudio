import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Seeds the Style Engine's taxonomy (12_PRD_StyleEngine.md / Task-011).
 * "스타일 데이터는 하드코딩하지 말고 관리 가능한 구조로 설계한다" -- so this
 * lives in Postgres (the `styles` table), not an in-code constant consumed
 * at runtime. Re-run with `npm run prisma:seed-styles`; it's idempotent
 * (upsert by slug).
 *
 * `slug` is always a stable ASCII key used only as the upsert identity --
 * it never derives from the (Korean) display `name`, since slugify() only
 * keeps [a-z0-9] and would otherwise collapse every Korean name to the
 * same empty string and collide.
 */

interface DeliverableTypeDef {
  name: string;
  slug: string;
}

// 레벨0 "작업물 유형" -- interviewQuestions.ts의 DELIVERABLE_TYPE_OPTIONS와
// 이름이 정확히 일치해야 한다(인터뷰 답변과 대조할 때 쓰인다). 지금까지 만든
// 152개 스타일(대분류~소분류)은 전부 "브랜딩 & 로고" 밑에 들어간다 -- 나머지
// 7개는 아직 하위 스타일이 없는 빈 상위 카테고리로만 존재한다.
const DELIVERABLE_TYPES: DeliverableTypeDef[] = [
  { name: "브랜딩 & 로고", slug: "branding-logo" },
  { name: "포스터", slug: "poster" },
  { name: "리플렛", slug: "leaflet" },
  { name: "브로슈어", slug: "brochure" },
  { name: "명함", slug: "business-card" },
  { name: "패키지", slug: "packaging" },
  { name: "앱 디자인", slug: "app-design" },
  { name: "웹사이트", slug: "website" },
];

interface L1Def {
  name: string;
  slug: string;
  keywords: string[];
}

const L1_CATEGORIES: L1Def[] = [
  { name: "모던", slug: "modern", keywords: ["현대적", "심플", "깔끔", "도시적"] },
  { name: "클래식", slug: "classic", keywords: ["전통", "격식있는", "고전적"] },
  { name: "럭셔리", slug: "luxury", keywords: ["고급", "프리미엄", "우아함", "세련"] },
  { name: "미니멀", slug: "minimal", keywords: ["미니멀", "여백", "단순함", "절제"] },
  { name: "플레이풀", slug: "playful", keywords: ["경쾌", "재미있는", "컬러풀", "발랄"] },
  { name: "테크", slug: "tech", keywords: ["테크", "미래지향적", "디지털", "혁신"] },
  { name: "오가닉", slug: "organic", keywords: ["자연", "오가닉", "친환경", "따뜻함"] },
  { name: "에디토리얼", slug: "editorial", keywords: ["에디토리얼", "타이포그래피", "잡지풍", "아트워크"] },
];

interface L2Def {
  name: string;
  slug: string;
}

// key는 L1의 slug와 동일하게 유지한다.
const L2_BY_CATEGORY: Record<string, L2Def[]> = {
  modern: [
    { name: "스위스", slug: "swiss" },
    { name: "지오메트릭", slug: "geometric" },
    { name: "코퍼레이트", slug: "corporate" },
  ],
  classic: [
    { name: "헤리티지", slug: "heritage" },
    { name: "빈티지", slug: "vintage" },
    { name: "트래디셔널", slug: "traditional" },
  ],
  luxury: [
    { name: "프리미엄", slug: "premium" },
    { name: "엘레강스", slug: "elegant" },
    { name: "부티크", slug: "boutique" },
  ],
  minimal: [
    { name: "스칸디나비안", slug: "scandinavian" },
    { name: "모노크롬", slug: "monochrome" },
    { name: "화이트스페이스", slug: "whitespace" },
  ],
  playful: [
    { name: "팝", slug: "pop" },
    { name: "위트", slug: "whimsical" },
    { name: "컬러풀", slug: "colorful" },
  ],
  tech: [
    { name: "퓨처리스틱", slug: "futuristic" },
    { name: "사이버", slug: "cyber" },
    { name: "데이터드리븐", slug: "data-driven" },
  ],
  organic: [
    { name: "보태니컬", slug: "botanical" },
    { name: "핸드크래프트", slug: "handcrafted" },
    { name: "어스톤", slug: "earthy" },
  ],
  editorial: [
    { name: "매거진", slug: "magazine" },
    { name: "타이포그래픽", slug: "typographic" },
    { name: "파인아트", slug: "fine-art" },
  ],
};

const L3_MODIFIERS: { name: string; slug: string; keywords: string[] }[] = [
  { name: "볼드", slug: "bold", keywords: ["강렬한", "대담한"] },
  { name: "소프트", slug: "soft", keywords: ["부드러운", "온화한"] },
  { name: "지오메트릭", slug: "geometric", keywords: ["기하학적", "구조적"] },
  { name: "웜", slug: "warm", keywords: ["따뜻한", "다정한"] },
  { name: "쿨", slug: "cool", keywords: ["차가운", "시원한"] },
];

function slugify(...parts: string[]): string {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  let l0Count = 0;
  let l1Count = 0;
  let l2Count = 0;
  let l3Count = 0;

  const deliverableTypeIds: Record<string, string> = {};
  for (const dt of DELIVERABLE_TYPES) {
    const row = await prisma.style.upsert({
      where: { slug: dt.slug },
      create: {
        name: dt.name,
        slug: dt.slug,
        level: 0,
        parentId: null,
        category: dt.name,
        keywords: [],
        description: `${dt.name} 작업물을 위한 스타일 상위 카테고리입니다.`,
      },
      update: {
        name: dt.name,
        category: dt.name,
        description: `${dt.name} 작업물을 위한 스타일 상위 카테고리입니다.`,
      },
    });
    deliverableTypeIds[dt.slug] = row.id;
    l0Count++;
  }
  const brandingLogoId = deliverableTypeIds["branding-logo"]!;

  for (const l1 of L1_CATEGORIES) {
    const l1Row = await prisma.style.upsert({
      where: { slug: l1.slug },
      create: {
        name: l1.name,
        slug: l1.slug,
        level: 1,
        parentId: brandingLogoId,
        category: l1.name,
        keywords: l1.keywords,
        description: `${l1.name} 계열 브랜드 디자인의 대분류 스타일입니다.`,
      },
      update: {
        name: l1.name,
        parentId: brandingLogoId,
        category: l1.name,
        keywords: l1.keywords,
        description: `${l1.name} 계열 브랜드 디자인의 대분류 스타일입니다.`,
      },
    });
    l1Count++;

    const l2Defs = L2_BY_CATEGORY[l1.slug] ?? [];
    for (const l2 of l2Defs) {
      const l2Slug = slugify(l1.slug, l2.slug);
      const l2Row = await prisma.style.upsert({
        where: { slug: l2Slug },
        create: {
          name: l2.name,
          slug: l2Slug,
          level: 2,
          parentId: l1Row.id,
          category: l1.name,
          keywords: [...l1.keywords, l2.name],
          description: `${l1.name} 계열의 ${l2.name} 중분류 스타일입니다.`,
        },
        update: {
          name: l2.name,
          parentId: l1Row.id,
          category: l1.name,
          keywords: [...l1.keywords, l2.name],
          description: `${l1.name} 계열의 ${l2.name} 중분류 스타일입니다.`,
        },
      });
      l2Count++;

      for (const modifier of L3_MODIFIERS) {
        const l3Name = `${l2.name} ${modifier.name}`;
        const l3Slug = slugify(l1.slug, l2.slug, modifier.slug);
        // 무드 참고 이미지 -- 파일명이 l3Slug와 정확히 일치해야 한다(생성
        // 스크립트가 이 slugify()를 그대로 미러링해서 만든 파일들).
        const sampleImageUrl = `/styles/${l3Slug}.png`;
        await prisma.style.upsert({
          where: { slug: l3Slug },
          create: {
            name: l3Name,
            slug: l3Slug,
            level: 3,
            parentId: l2Row.id,
            category: l1.name,
            keywords: [...l1.keywords, l2.name, ...modifier.keywords],
            description: `${l1.name} 계열의 ${l2.name} 스타일에 ${modifier.name} 느낌을 더한 디자인 방향입니다.`,
            sampleImageUrl,
          },
          update: {
            name: l3Name,
            parentId: l2Row.id,
            category: l1.name,
            keywords: [...l1.keywords, l2.name, ...modifier.keywords],
            description: `${l1.name} 계열의 ${l2.name} 스타일에 ${modifier.name} 느낌을 더한 디자인 방향입니다.`,
            sampleImageUrl,
          },
        });
        l3Count++;
      }
    }
  }

  const total = l0Count + l1Count + l2Count + l3Count;
  console.log(`Seeded styles: L0=${l0Count} L1=${l1Count} L2=${l2Count} L3=${l3Count} total=${total}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
