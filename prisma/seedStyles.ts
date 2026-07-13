import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Seeds the Style Engine's taxonomy (12_PRD_StyleEngine.md / Task-011).
 * "스타일 데이터는 하드코딩하지 말고 관리 가능한 구조로 설계한다" -- so this
 * lives in Postgres (the `styles` table), not an in-code constant consumed
 * at runtime. Re-run with `npm run prisma:seed-styles`; it's idempotent
 * (upsert by slug).
 */

interface L1Def {
  name: string;
  slug: string;
  keywords: string[];
}

const L1_CATEGORIES: L1Def[] = [
  { name: "Modern", slug: "modern", keywords: ["현대적", "심플", "깔끔", "도시적"] },
  { name: "Classic", slug: "classic", keywords: ["전통", "격식있는", "고전적"] },
  { name: "Luxury", slug: "luxury", keywords: ["고급", "프리미엄", "우아함", "세련"] },
  { name: "Minimal", slug: "minimal", keywords: ["미니멀", "여백", "단순함", "절제"] },
  { name: "Playful", slug: "playful", keywords: ["경쾌", "재미있는", "컬러풀", "발랄"] },
  { name: "Tech", slug: "tech", keywords: ["테크", "미래지향적", "디지털", "혁신"] },
  { name: "Organic", slug: "organic", keywords: ["자연", "오가닉", "친환경", "따뜻함"] },
  { name: "Editorial", slug: "editorial", keywords: ["에디토리얼", "타이포그래피", "잡지풍", "아트워크"] },
];

const L2_BY_CATEGORY: Record<string, string[]> = {
  modern: ["Swiss", "Geometric", "Corporate"],
  classic: ["Heritage", "Vintage", "Traditional"],
  luxury: ["Premium", "Elegant", "Boutique"],
  minimal: ["Scandinavian", "Monochrome", "Whitespace"],
  playful: ["Pop", "Whimsical", "Colorful"],
  tech: ["Futuristic", "Cyber", "Data-driven"],
  organic: ["Botanical", "Handcrafted", "Earthy"],
  editorial: ["Magazine", "Typographic", "Fine Art"],
};

const L3_MODIFIERS: { name: string; keywords: string[] }[] = [
  { name: "Bold", keywords: ["강렬한", "대담한"] },
  { name: "Soft", keywords: ["부드러운", "온화한"] },
  { name: "Geometric", keywords: ["기하학적", "구조적"] },
  { name: "Warm", keywords: ["따뜻한", "다정한"] },
  { name: "Cool", keywords: ["차가운", "시원한"] },
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

  let l1Count = 0;
  let l2Count = 0;
  let l3Count = 0;

  for (const l1 of L1_CATEGORIES) {
    const l1Row = await prisma.style.upsert({
      where: { slug: l1.slug },
      create: {
        name: l1.name,
        slug: l1.slug,
        level: 1,
        parentId: null,
        category: l1.name,
        keywords: l1.keywords,
        description: `${l1.name} 계열 브랜드 디자인의 대분류 스타일입니다.`,
      },
      update: { keywords: l1.keywords },
    });
    l1Count++;

    const l2Names = L2_BY_CATEGORY[l1.slug] ?? [];
    for (const l2Name of l2Names) {
      const l2Slug = slugify(l1.slug, l2Name);
      const l2Row = await prisma.style.upsert({
        where: { slug: l2Slug },
        create: {
          name: l2Name,
          slug: l2Slug,
          level: 2,
          parentId: l1Row.id,
          category: l1.name,
          keywords: [...l1.keywords, l2Name.toLowerCase()],
          description: `${l1.name} 계열의 ${l2Name} 중분류 스타일입니다.`,
        },
        update: { parentId: l1Row.id, keywords: [...l1.keywords, l2Name.toLowerCase()] },
      });
      l2Count++;

      for (const modifier of L3_MODIFIERS) {
        const l3Name = `${l2Name} ${modifier.name}`;
        const l3Slug = slugify(l1.slug, l2Name, modifier.name);
        await prisma.style.upsert({
          where: { slug: l3Slug },
          create: {
            name: l3Name,
            slug: l3Slug,
            level: 3,
            parentId: l2Row.id,
            category: l1.name,
            keywords: [...l1.keywords, l2Name.toLowerCase(), ...modifier.keywords],
            description: `${l1.name} 계열의 ${l2Name} 스타일에 ${modifier.name} 느낌을 더한 디자인 방향입니다.`,
          },
          update: {
            parentId: l2Row.id,
            keywords: [...l1.keywords, l2Name.toLowerCase(), ...modifier.keywords],
          },
        });
        l3Count++;
      }
    }
  }

  const total = l1Count + l2Count + l3Count;
  console.log(`Seeded styles: L1=${l1Count} L2=${l2Count} L3=${l3Count} total=${total}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
