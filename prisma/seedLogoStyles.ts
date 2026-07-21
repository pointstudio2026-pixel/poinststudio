import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Seeds the "로고 스타일 선택" step's 5 structural categories (워드마크류
 * 타이포 중심/심볼 중심/일러스트 중심/조합형/프리미엄). This is a different
 * axis from the Style Engine's mood taxonomy (seedStyles.ts) -- lives in
 * Postgres for the same "관리 가능한 구조" reason, not an in-code constant.
 * Re-run with `npm run prisma:seed-logo-styles`; it's idempotent (upsert by
 * slug). "AI 추천" is NOT a seeded row -- it's a screen widget that ranks
 * these 5 categories at request time (see logoStyleRules.ts).
 */

interface LogoStyleCategoryDef {
  slug: string;
  name: string;
  description: string;
  subStyles: string[];
  keywords: string[];
  sampleImageUrl: string;
  sortOrder: number;
}

const CATEGORIES: LogoStyleCategoryDef[] = [
  {
    slug: "typography",
    name: "타이포 중심",
    description: "글자를 중심으로 브랜드를 표현하는 스타일입니다.",
    subStyles: ["워드마크", "레터마크", "모노그램", "한글 타이포", "캘리그라피", "시그니처"],
    keywords: ["텍스트", "글자", "타이포그래피", "심플", "미니멀", "클래식", "전통"],
    sampleImageUrl: "/logo-styles/typography.svg",
    sortOrder: 1,
  },
  {
    slug: "symbol",
    name: "심볼 중심",
    description: "심플한 심볼을 중심으로 브랜드를 표현합니다.",
    subStyles: ["미니멀 심볼", "기하학 심볼", "추상 심볼", "픽토그램", "라인 심볼", "플랫 심볼"],
    keywords: ["심볼", "아이콘", "미니멀", "기하학적", "테크", "모던", "심플"],
    sampleImageUrl: "/logo-styles/symbol.svg",
    sortOrder: 2,
  },
  {
    slug: "illustration",
    name: "일러스트 중심",
    description: "친근하고 개성 있는 브랜드에 적합합니다.",
    subStyles: ["일러스트 심볼", "마스코트", "동물", "식물", "오브젝트"],
    keywords: ["친근한", "개성있는", "자연", "오가닉", "캐릭터", "플레이풀", "따뜻함"],
    sampleImageUrl: "/logo-styles/illustration.svg",
    sortOrder: 3,
  },
  {
    slug: "combination",
    name: "조합형",
    description: "가장 많이 사용하는 브랜드 로고 형태입니다.",
    subStyles: ["심볼 + 워드마크", "엠블럼", "원형", "프레임", "커스텀 조합"],
    keywords: ["균형", "조합", "범용적", "신뢰", "안정적", "전문적"],
    sampleImageUrl: "/logo-styles/combination.svg",
    sortOrder: 4,
  },
  {
    slug: "premium",
    name: "프리미엄 스타일",
    description: "독창성과 차별성을 강조하는 스타일입니다.",
    subStyles: ["네거티브 스페이스", "그라디언트", "3D", "패턴"],
    keywords: ["고급", "프리미엄", "독창적", "세련된", "차별화", "우아함", "혁신"],
    sampleImageUrl: "/logo-styles/premium.svg",
    sortOrder: 5,
  },
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  let count = 0;
  for (const def of CATEGORIES) {
    await prisma.logoStyleCategory.upsert({
      where: { slug: def.slug },
      create: {
        slug: def.slug,
        name: def.name,
        description: def.description,
        subStyles: def.subStyles,
        keywords: def.keywords,
        sampleImageUrl: def.sampleImageUrl,
        sortOrder: def.sortOrder,
      },
      update: {
        name: def.name,
        description: def.description,
        subStyles: def.subStyles,
        keywords: def.keywords,
        sampleImageUrl: def.sampleImageUrl,
        sortOrder: def.sortOrder,
      },
    });
    count++;
  }

  console.log(`Seeded logo style categories: ${count}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
