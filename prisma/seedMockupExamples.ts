import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

/**
 * 목업 스튜디오 카테고리별 예시 이미지 53장(2026-07-25, 신규 카테고리
 * package/leaflet/banner/uniform 포함 10개 카테고리 x 6장 -- 기존 7장은
 * 재사용) -- mockupExamplesManifest.json(실제 GPT Vision 채점 결과 포함)을
 * 읽어 두 곳에 나눠 심는다:
 * 1. MockupTemplate -- 목업 스튜디오 갤러리에 표시되는 실제 예시 이미지.
 * 2. TrainingExample(category="목업", source="ADMIN") -- 관리자 "작업물
 *    학습자료" 페이지에서 프롬프트+평가 내역을 확인할 수 있는 참고자료.
 *    사용자 지시(2026-07-24, 2026-07-25): DB에 들어가는 모든 프롬프트는
 *    반드시 이 화면에서 보여야 한다.
 * slug/prompt 기준으로 이미 존재하면 건너뛰어(upsert/existence check) 여러
 * 번 실행해도 안전하다. Re-run with `npx tsx prisma/seedMockupExamples.ts`.
 *
 * 중요(2026-07-29): 이 매니페스트의 `name`/`keywords`는 반드시 실제 생성된
 * `imagePath` 이미지를 직접 열어 보고("라떼 포스터"면 진짜 라떼/카페가
 * 그려져 있어야 함) 붙여야 한다. `prompt` 필드는 미니멀/내추럴/컬러풀 같은
 * 톤·스타일만 지시할 뿐 구체적인 업종/아이템을 지정하지 않으므로, prompt의
 * 톤이나 카테고리만 보고 이름을 추측하면 "레몬에이드 포스터"인데 실제로는
 * 가구 브랜드 광고가 그려진 것처럼 이름과 실제 이미지가 어긋난다(2026-07-29
 * 실제 발생 사례). 새 템플릿을 추가할 때마다 이 규칙을 반드시 지킬 것.
 *
 * 중요(2026-07-29): 배경 이미지 안에 박히는 텍스트(브랜드명, 문구 등)는
 * 반드시 영어로만 생성할 것 -- 특정 업종에 국한되지 않는 범용성이 가장
 * 넓기 때문. 그럼에도 한글이 조금이라도 찍힌 이미지가 생기면(과거 생성분
 * 등) `containsKoreanText: true`를 반드시 표시할 것 -- 이 값이 true인
 * 템플릿은 한국어 사용자에게만 노출되고, 그 외 언어 사용자에게는 검색/
 * 목록에서 자동으로 제외된다(PrismaMockupTemplateRepository).
 */

interface ManifestRow {
  category: string;
  name: string;
  slug: string;
  description: string;
  imagePath: string;
  placement: { xPct: number; yPct: number; widthPct: number; heightPct: number };
  fullDesignPlacement: { xPct: number; yPct: number; widthPct: number; heightPct: number };
  prompt: string;
  deliverableType: string;
  visionScore: number;
  visionSummary: string;
  visionEvaluation: unknown;
  keywords?: string[];
  containsKoreanText?: boolean;
}

const ADMIN_EMAIL = "pointstudio2026@gmail.com";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    throw new Error(`관리자 계정(${ADMIN_EMAIL})을 찾을 수 없습니다.`);
  }

  const manifestPath = new URL("./mockupExamplesManifest.json", import.meta.url);
  const rows: ManifestRow[] = JSON.parse(readFileSync(manifestPath, "utf-8"));

  let templatesUpserted = 0;
  let examplesCreated = 0;
  let examplesSkipped = 0;

  for (const row of rows) {
    await prisma.mockupTemplate.upsert({
      where: { slug: row.slug },
      create: {
        slug: row.slug,
        category: row.category,
        name: row.name,
        description: row.description,
        backgroundUrl: row.imagePath,
        keywords: row.keywords ?? [],
        containsKoreanText: row.containsKoreanText ?? false,
        placementXPct: row.placement.xPct,
        placementYPct: row.placement.yPct,
        placementWidthPct: row.placement.widthPct,
        placementHeightPct: row.placement.heightPct,
        fullDesignPlacementXPct: row.fullDesignPlacement.xPct,
        fullDesignPlacementYPct: row.fullDesignPlacement.yPct,
        fullDesignPlacementWidthPct: row.fullDesignPlacement.widthPct,
        fullDesignPlacementHeightPct: row.fullDesignPlacement.heightPct,
      },
      update: {
        category: row.category,
        name: row.name,
        description: row.description,
        backgroundUrl: row.imagePath,
        keywords: row.keywords ?? [],
        containsKoreanText: row.containsKoreanText ?? false,
      },
    });
    templatesUpserted++;

    const existingExample = await prisma.trainingExample.findFirst({
      where: { prompt: row.prompt, category: "목업" },
      select: { id: true },
    });
    if (existingExample) {
      examplesSkipped++;
      continue;
    }

    await prisma.trainingExample.create({
      data: {
        prompt: row.prompt,
        deliverableType: row.deliverableType,
        createdByUserId: admin.id,
        source: "ADMIN",
        category: "목업",
        evaluationScore: row.visionScore,
        evaluationBreakdown: {
          visionQuality: { score: row.visionScore, note: row.visionSummary },
        },
        evaluatedAt: new Date(),
      },
    });
    examplesCreated++;
  }

  console.log(
    `MockupTemplate upserted: ${templatesUpserted}, TrainingExample created: ${examplesCreated}, skipped(already existed): ${examplesSkipped}`,
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
