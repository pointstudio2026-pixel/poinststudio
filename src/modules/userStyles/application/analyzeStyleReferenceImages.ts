import type { TextCompletionProvider } from "@/shared/ai/TextCompletionProvider";

const ANALYSIS_SYSTEM_PROMPT =
  "당신은 브랜드/로고 디자인 스타일을 분석하는 전문가입니다. 업로드된 이미지들에 공통으로 " +
  "나타나는 시각적 스타일을 로고·브랜드 디자인 참고용으로 간결하게 서술하세요. 색상, 형태, " +
  "선 굵기, 여백, 전체적인 분위기를 중심으로 3~4문장 이내로 답하세요. 이미지 속 특정 " +
  "브랜드/제품을 지칭하지 말고 스타일 자체만 설명하세요.";

/**
 * "학습" = 참고 이미지 등록. 실제 모델 파인튜닝이 아니라, 업로드 시(또는
 * 재분석 요청 시) 1회만 비전 분석 AI를 호출해 시각적 스타일을 텍스트로
 * 뽑아내고 그 텍스트만 캐시한다 -- 생성마다 이미지를 다시 참조하지 않으므로
 * 비용이 카테고리 변경 시 1회로 통제된다.
 *
 * 비전(이미지 입력)을 실제로 지원하는 Provider는 현재 OpenAI뿐이므로
 * (`OpenAITextCompletionProvider`), 다른 Provider가 resolve되면 이미지를
 * 무시한 채 부정확한 텍스트를 만들어내는 대신 아예 호출하지 않고 null을
 * 반환한다 -- 실패 시 null 처리와 동일한 우아한 성능 저하 경로를 탄다.
 */
export async function analyzeStyleReferenceImages(
  provider: TextCompletionProvider,
  images: { dataUri: string; contentType: string }[],
): Promise<string | null> {
  if (provider.name !== "openai" || images.length === 0) {
    return null;
  }

  try {
    const result = await provider.complete({
      systemPrompt: ANALYSIS_SYSTEM_PROMPT,
      userPrompt: "이 이미지들의 공통된 디자인 스타일을 분석해 주세요.",
      imageDataUris: images.map((img) => img.dataUri),
      maxTokens: 300,
      temperature: 0.5,
    });
    return result.text;
  } catch {
    return null;
  }
}
