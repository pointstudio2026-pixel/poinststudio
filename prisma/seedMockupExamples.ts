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
 *
 * 중요(2026-07-30, 최종 규칙 -- 위 텍스트 언어 규칙보다 우선): 로고 배치
 * 영역이 아닌 곳에 들어가는 타이포(간판 옆 문구, 메뉴판, 패키지 라벨,
 * 웹사이트 nav 등)에는 업체명/브랜드명을 절대 포함하지 않는다. 실제
 * 업체명이든 가짜 placeholder 업체명("NEXORA", "AURORA STUDIO" 같은 것)이든
 * 전부 금지 -- 사용자가 자기 로고를 합성했을 때 로고의 실제 상호명과
 * 배경에 적힌 상호명이 달라 보이는 문제가 생기기 때문(2026-07-30 감사에서
 * 66개 템플릿 중 65개가 이 문제로 발각되어 대량 정리함). 다른 타이포가
 * 꼭 필요하면 업종/스타일에 어울리는 일반 문구(메뉴 항목, 원산지 표기,
 * "OPEN"/"WELCOME" 같은 안내문, 장식적 슬로건 등 특정 상호를 가리키지
 * 않는 텍스트)로만 채운다. 새 템플릿을 추가하기 전 이미지를 직접 보고
 * 이 규칙을 반드시 확인할 것.
 *
 * 중요(2026-07-30, 로고 자리 규칙): 배경 이미지에는 로고가 들어갈 자리가
 * 명확하게 보여야 한다 -- 그냥 빈 공간이 아니라, 글자 없는 추상적인
 * placeholder 로고 마크(원형 배지, 단순 도형, 모노그램 아이콘 등)를 실제로
 * 그려 넣어서 "여기가 로고 자리다"가 한눈에 보이게 한다. 합성 시스템은 이
 * placeholder 마크 위치에 사용자의 실제 로고를 그대로 대체하는 방식이므로,
 * 자리가 애매하면(빈 배경, 자리가 안 보임) 합성 결과가 부자연스러워진다.
 * 단, 이 placeholder 마크 자체에도 글자/이니셜을 절대 넣지 않는다 --
 * 넣는 순간 위 업체명 금지 규칙을 어기게 된다.
 */

interface ManifestRow {
  category: string;
  name: string;
  slug: string;
  description: string;
  imagePath: string;
  placement: { xPct: number; yPct: number; widthPct: number; heightPct: number };
  // 완성된 결과물 전체를 크게 합성할 영역 -- DELIVERABLE_TYPE_TO_MOCKUP_CATEGORY에
  // 매핑된 카테고리(명함/웹사이트/앱 디자인/포스터/브로슈어/패키지/리플렛)만
  // 채운다. 간판/배너/유니폼처럼 "브랜딩 & 로고"로 묶이는 카테고리는 로고
  // 마크 하나만 합성하므로 null.
  fullDesignPlacement: { xPct: number; yPct: number; widthPct: number; heightPct: number } | null;
  prompt: string;
  deliverableType: string;
  visionScore: number;
  visionSummary: string;
  visionEvaluation: unknown;
  keywords?: string[];
  containsKoreanText?: boolean;
  /** 배경에 업체명이 박혀 로고와 상호명이 어긋나는 템플릿(2026-07-30 감사)을
   * 목록/검색에서 숨긴다 -- 실사용 참조가 있어 행을 지울 수 없는 경우. */
  hidden?: boolean;
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
        fullDesignPlacementXPct: row.fullDesignPlacement?.xPct,
        fullDesignPlacementYPct: row.fullDesignPlacement?.yPct,
        fullDesignPlacementWidthPct: row.fullDesignPlacement?.widthPct,
        fullDesignPlacementHeightPct: row.fullDesignPlacement?.heightPct,
        hidden: row.hidden ?? false,
      },
      update: {
        category: row.category,
        name: row.name,
        description: row.description,
        backgroundUrl: row.imagePath,
        keywords: row.keywords ?? [],
        containsKoreanText: row.containsKoreanText ?? false,
        hidden: row.hidden ?? false,
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
