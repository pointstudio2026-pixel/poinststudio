import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { ValidationError } from "@/shared/errors/AppError";
import { requireContentApiKey } from "@/shared/http/contentApiKey";
import { resolveImageGenerationProvider } from "@/shared/ai/imageGenerationRouter";
import { resolveFileStorage } from "@/shared/storage/fileStorageRouter";
import { subscriptionsContainer } from "@/modules/subscriptions/container";
import { industryRepositoryInstance } from "@/modules/industries/container";
import { buildContentGuidanceContext, pickIndustrySymbol, pickRenderingMode } from "@/modules/prompts/domain/promptBuilder";

const CONTENT_GENERATION_EVENT_TYPE = "content_pipeline_image";

const requestSchema = z.object({
  prompt: z.string().min(1),
  alt: z.string().min(1),
  sizePreset: z.enum(["square", "portrait", "landscape"]).optional(),
  // 2026-07-30: 프로젝트 생성 파이프라인(BuildPromptUseCase)과 동일한
  // 업종 상징 요소/렌더링 방식 규칙을 n8n 콘텐츠 이미지에도 적용하기
  // 위한 선택 필드 -- 셋 다 없으면(기존 n8n 워크플로우) 동작이 전혀
  // 바뀌지 않는다. n8n이 보낸 prompt를 대체하지 않고 뒤에 덧붙인다.
  industry: z.string().optional(),
  styleCategory: z.string().optional(),
  isLogo: z.boolean().optional(),
});

/**
 * 프로젝트 생성 파이프라인(BuildPromptUseCase)과 동일한 축1(업종 상징
 * 요소)/축2(렌더링 방식)/축3(업종 무드 보정) 규칙을 n8n 콘텐츠 이미지에도
 * 적용한다. industry/styleCategory 둘 다 없으면 빈 문자열(기존 n8n
 * 워크플로우는 동작이 전혀 바뀌지 않는다).
 */
async function buildN8nContentGuidance(input: {
  industry?: string;
  styleCategory?: string;
  isLogo?: boolean;
}): Promise<string> {
  if (!input.industry && !input.styleCategory) return "";
  const isLogo = input.isLogo ?? false;
  const industrySymbol = input.industry ? pickIndustrySymbol(input.industry) : undefined;
  const renderingMode = !isLogo && input.styleCategory ? pickRenderingMode(input.styleCategory) : undefined;
  const industryRow = input.industry ? await industryRepositoryInstance.findByName(input.industry) : null;
  const metadata = industryRow
    ? {
        recommendedColors: industryRow.recommendedColors,
        recommendedLogoStyles: industryRow.recommendedLogoStyles,
        recommendedTypography: industryRow.recommendedTypography,
        recommendedPersonality: industryRow.recommendedPersonality,
      }
    : undefined;
  return buildContentGuidanceContext({ isLogo, industrySymbol, renderingMode, metadata });
}

function decodeDataUri(dataUri: string): { buffer: Buffer; contentType: string } {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  const contentType = match?.[1];
  const data = match?.[2];
  if (!contentType || !data) {
    throw new ValidationError("이미지 생성 결과를 읽을 수 없습니다.", { reason: "unexpected image format" });
  }
  return { buffer: Buffer.from(data, "base64"), contentType };
}

/**
 * n8n 콘텐츠 자동화 파이프라인이 업종×스타일처럼 실제 조합에 맞는 이미지를
 * 새로 생성할 때 쓰는 엔드포인트 -- generate-text와 같은 이유로 ASTER의
 * 기존 멀티 프로바이더 이미지 생성 시스템을 그대로 거쳐간다. gpt-image는
 * base64 데이터 URI를 반환할 뿐 영구 URL이 아니므로, 여기서 바로 실제
 * Object Storage(R2, STORAGE_* 설정됨)에 업로드해 영구 URL을 돌려준다 --
 * n8n이 응답을 못 받거나 나중에 다시 요청해도 이미지가 사라지지 않는다.
 */
export async function POST(request: NextRequest) {
  try {
    requireContentApiKey(request);

    const body = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const contentGuidance = await buildN8nContentGuidance(parsed.data);
    const userPrompt = contentGuidance ? `${parsed.data.prompt}\n\n${contentGuidance}` : parsed.data.prompt;

    const provider = resolveImageGenerationProvider();
    const result = await provider.generate({
      systemPrompt: "",
      userPrompt,
      count: 1,
      sizePreset: parsed.data.sizePreset,
    });
    const generated = result.images[0];
    if (!generated) {
      throw new ValidationError("이미지 생성에 실패했습니다.");
    }

    const { buffer, contentType } = decodeDataUri(generated.url);
    const fileStorage = resolveFileStorage();
    const saved = await fileStorage.save(`content/${randomUUID()}`, buffer, contentType);

    const contentPipelineUserId = process.env.CONTENT_PIPELINE_USER_ID;
    if (contentPipelineUserId) {
      await subscriptionsContainer.recordUsageUseCase.execute({
        userId: contentPipelineUserId,
        eventType: CONTENT_GENERATION_EVENT_TYPE,
        quantity: 1,
        costAmount: result.costAmount,
        metadata: { source: "n8n_content_pipeline", provider: result.provider, model: result.model },
      });
    }

    return apiSuccess({
      url: `/api/content/images/${saved.key}`,
      alt: parsed.data.alt,
      provider: result.provider,
      model: result.model,
    });
  } catch (err) {
    return toApiError(err);
  }
}
