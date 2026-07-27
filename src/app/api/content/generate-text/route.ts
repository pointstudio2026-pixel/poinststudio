import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { ValidationError } from "@/shared/errors/AppError";
import { requireContentApiKey } from "@/shared/http/contentApiKey";
import { resolveTextCompletionProvider } from "@/shared/ai/textCompletionRouter";
import { subscriptionsContainer } from "@/modules/subscriptions/container";

const CONTENT_GENERATION_EVENT_TYPE = "content_pipeline_text";

// 프로바이더별 정확한 토큰 단가를 이 레이어에서 다시 계산하지 않고, 대략적인
// 블렌디드 단가(문자수/4 ≈ 토큰수, $3/1M 토큰)로만 추정한다 -- 일일 비용
// 리포트에 "이 파이프라인이 대략 얼마 쓰는지" 방향성을 보여주는 게 목적이라
// 텍스트 completion 비용은 이미지 생성 대비 무시할 수준으로 작고, 정밀할
// 필요가 없다.
const BLENDED_COST_PER_TOKEN = 3 / 1_000_000;

const requestSchema = z.object({
  systemPrompt: z.string().min(1),
  userPrompt: z.string().min(1),
  maxTokens: z.number().int().positive().max(4000).optional(),
  provider: z.enum(["openai", "gemini", "claude"]).optional(),
});

// n8n 콘텐츠 자동화 파이프라인(주제 초안 작성/번역)이 ASTER의 기존 멀티
// 프로바이더 AI 시스템을 그대로 거쳐가도록 만든 범용 텍스트 completion
// 엔드포인트 -- n8n이 OpenAI 등을 직접 호출하면 그 비용이 일일 리포트(
// UsageLog 기반)에 안 잡히므로, 이 경로를 통해서만 호출하게 해서 비용
// 추적을 한 곳으로 모은다.
export async function POST(request: NextRequest) {
  try {
    requireContentApiKey(request);

    const body = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("입력값이 올바르지 않습니다.", parsed.error.flatten());
    }

    const provider = resolveTextCompletionProvider(parsed.data.provider);
    const result = await provider.complete({
      systemPrompt: parsed.data.systemPrompt,
      userPrompt: parsed.data.userPrompt,
      maxTokens: parsed.data.maxTokens ?? 2000,
    });

    const contentPipelineUserId = process.env.CONTENT_PIPELINE_USER_ID;
    if (contentPipelineUserId) {
      const estimatedTokens = (parsed.data.systemPrompt.length + parsed.data.userPrompt.length + result.text.length) / 4;
      await subscriptionsContainer.recordUsageUseCase.execute({
        userId: contentPipelineUserId,
        eventType: CONTENT_GENERATION_EVENT_TYPE,
        quantity: 1,
        costAmount: estimatedTokens * BLENDED_COST_PER_TOKEN,
        metadata: { source: "n8n_content_pipeline", provider: result.provider, model: result.model, estimated: true },
      });
    }

    return apiSuccess({ text: result.text, provider: result.provider, model: result.model });
  } catch (err) {
    return toApiError(err);
  }
}
