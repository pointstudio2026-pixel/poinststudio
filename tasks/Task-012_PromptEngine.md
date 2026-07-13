# Task-012_PromptEngine

**Project:** ASTER **Task ID:** TASK-012 **Title:** Prompt Engine
**Priority:** P0 **Estimated Effort:** 6\~8 hours

------------------------------------------------------------------------

# Objective

Brand Knowledge와 사용자가 확정한 Style을 기반으로 AI 이미지 생성 모델에
전달할 최적화된 프롬프트를 생성하는 Prompt Engine을 구현한다.

Prompt Engine은 사용자가 프롬프트를 직접 작성하지 않아도 일관되고 재현
가능한 결과를 얻도록 하는 ASTER의 핵심 엔진이다.

------------------------------------------------------------------------

# Related Documents

-   12_PRD_StyleEngine.md
-   13_PRD_AsterBrain.md
-   14_PRD_PromptEngine.md
-   15_PRD_ImageGeneration.md
-   21_PRD_APIContract.md
-   25_AIProviderArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 복잡한 프롬프트를 고민하지 않고도 브랜드 방향성과 스타일이
반영된 결과를 얻고 싶다.

------------------------------------------------------------------------

# Scope

포함 - Prompt Template 관리 - Brand Knowledge 적용 - Style 적용 -
Provider별 Prompt 변환 - Prompt Version 저장 - Prompt 미리보기

제외 - 이미지 생성 실행 - 이미지 편집

------------------------------------------------------------------------

# Functional Requirements

-   시스템 프롬프트와 사용자 프롬프트 분리
-   Provider(OpenAI, Gemini 등)별 형식 변환
-   금지어 및 안전 규칙 적용
-   Prompt Version 생성
-   Prompt Hash 생성
-   동일 입력 시 동일 Prompt 재현

------------------------------------------------------------------------

# Workflow

Brand Knowledge → Selected Style → Prompt Builder → Safety Layer →
Provider Formatter → Prompt Version → Image Generation

------------------------------------------------------------------------

# Output Schema

``` json
{
  "systemPrompt": "...",
  "userPrompt": "...",
  "provider": "default",
  "hash": "sha256",
  "metadata": {}
}
```

------------------------------------------------------------------------

# Backend Tasks

-   PromptBuilderUseCase
-   PromptTemplateRepository
-   ProviderFormatter
-   PromptVersionManager
-   PromptHashService

------------------------------------------------------------------------

# Frontend Tasks

-   Prompt Preview Panel
-   Advanced Options
-   Provider Selector(관리자/실험용)
-   Prompt Version History

------------------------------------------------------------------------

# API

POST /prompts/build

GET /prompts/{projectId}

GET /prompts/{projectId}/versions

------------------------------------------------------------------------

# Database

-   prompt_versions
-   brand_strategies
-   style_selections

------------------------------------------------------------------------

# Acceptance Criteria

-   Prompt 생성 성공
-   Provider별 변환 성공
-   Prompt Version 저장
-   동일 입력 재현 가능
-   Safety Rule 적용

------------------------------------------------------------------------

# Test Checklist

-   스타일 변경
-   Brand Brief 변경
-   Provider 변경
-   Prompt Hash 동일성
-   금지어 포함 입력
-   Version 비교

------------------------------------------------------------------------

# Files Expected

Backend - modules/prompts/

Frontend - features/prompts/ - components/prompts/

Tests - unit - integration - e2e

------------------------------------------------------------------------

# Definition of Done

-   Prompt Engine 구현
-   Provider Formatter 구현
-   Version 관리
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Prompt Engine은 ASTER에서 유일하게 프롬프트를 생성하는 컴포넌트이다.
다른 모듈에서 프롬프트를 직접 조합하지 않는다. Provider Adapter와
분리하여 구현하고, 모든 프롬프트는 버전 관리와 Safety Layer를 거친다.

End of Document
