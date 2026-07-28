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
