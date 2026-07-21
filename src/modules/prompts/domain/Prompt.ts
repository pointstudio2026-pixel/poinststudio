import type { SizePreset } from "@/shared/ai/ImageGenerationProvider";

export type PromptProvider = "openai" | "gemini" | "nanobanana";

export interface PromptLayers {
  systemInstructions: string;
  brandContext: string;
  /** 업종별 시각적 관습(색감/분위기) 고정 뼈대. 매칭되는 업종이 없으면("기타") 빈 문자열. */
  industryContext: string;
  styleContext: string;
  /** 작업물 유형 × 스타일 대분류 조합 고정 뼈대(트렌드 리서치 반영). */
  baseTemplateContext: string;
  /** "내 스타일"에서 선택한 카테고리의 비전 분석 설명. 선택 안 했으면 빈 문자열. */
  userStyleContext: string;
  /** 스타일 화면에서 미리 선택한 브랜드 컬러 팔레트 지시. 선택 안 했으면 빈 문자열. */
  colorContext: string;
  logoStyleContext: string;
  /** 작업물 유형 전용 인터뷰 답변 (예: 포스터의 행사 맥락). 브랜딩 & 로고는 빈 문자열. */
  deliverableContext: string;
  /** 브랜드 인터뷰 "그 외 사항"(무조건 포함/제외) 답변. 미입력이면 빈 문자열. */
  additionalRequirementsContext: string;
  /** 작업물 유형별 타이포그래피 크기 지침(예: 명함은 8~9pt 마지노선). */
  typographyContext: string;
  generationObjective: string;
  safetyConstraints: string;
}

export interface GenerationPayload {
  provider: PromptProvider;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  sizePreset: SizePreset;
  parameters: Record<string, unknown>;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  versionNumber: number;
  provider: PromptProvider;
  systemPrompt: string;
  userPrompt: string;
  hash: string;
  payload: GenerationPayload;
  flaggedTerms: string[];
  createdAt: Date;
}

export interface Prompt {
  id: string;
  projectId: string;
  currentVersion: PromptVersion;
}
