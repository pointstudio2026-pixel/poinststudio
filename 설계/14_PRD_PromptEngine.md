# 14_PRD_PromptEngine

Project: ASTER Version: 3.0 (AI-Native Specification) Status: Draft

------------------------------------------------------------------------

# Feature ID

PRD-009

Feature Name

Prompt Engine

Priority

P0 (Core AI Infrastructure)

------------------------------------------------------------------------

# Goal

Prompt Engine는 사용자가 프롬프트를 직접 작성하지 않아도 Brand Brief와
Brand Strategy를 기반으로 최적의 AI 요청을 자동 생성한다.

------------------------------------------------------------------------

# Philosophy

사용자는 브랜드를 설명한다.

ASTER는 프롬프트를 설계한다.

------------------------------------------------------------------------

# Inputs

-   Approved Brand Brief
-   Approved Brand Strategy
-   Selected Style
-   Color Direction
-   Typography Direction
-   Generation Settings

------------------------------------------------------------------------

# Outputs

-   System Prompt
-   User Prompt
-   Model Parameters
-   Safety Context
-   Generation Payload

------------------------------------------------------------------------

# Prompt Pipeline

1.  Validate Inputs
2.  Merge Brand Context
3.  Merge Style Context
4.  Apply Safety Rules
5.  Build Structured Prompt
6.  Optimize Tokens
7.  Route to AI Model

------------------------------------------------------------------------

# Prompt Layers

## Layer 1

System Instructions

## Layer 2

Brand Context

## Layer 3

Style Context

## Layer 4

Generation Objective

## Layer 5

Safety Constraints

------------------------------------------------------------------------

# Model Adapter

Prompt Engine는 특정 모델에 종속되지 않는다.

지원 구조 - OpenAI - Google Gemini - Nano Banana - Future Providers

각 모델은 Adapter를 통해 변환한다.

------------------------------------------------------------------------

# Safety Rules

-   특정 브랜드 복제 금지
-   등록상표 모방 유도 금지
-   저작권 침해 가능성이 높은 요청 일반화
-   위험 요청은 거절 또는 안전한 방향으로 변환

------------------------------------------------------------------------

# Prompt Versioning

모든 프롬프트는 버전 관리한다.

-   Prompt Version
-   Model Version
-   Prompt Hash
-   Timestamp

------------------------------------------------------------------------

# API

POST /prompt/build GET /prompt/{projectId} POST /prompt/preview

------------------------------------------------------------------------

# Database

prompt_versions prompt_templates model_adapters

------------------------------------------------------------------------

# Error Handling

PROMPT-001 Invalid Input PROMPT-002 Build Failed PROMPT-003 Adapter
Error

------------------------------------------------------------------------

# Acceptance Criteria

-   Brand Brief 기반 프롬프트 생성
-   모델별 Adapter 동작
-   Safety Rules 적용
-   Prompt Preview 제공

------------------------------------------------------------------------

# Definition of Done

-   Prompt Builder 구현
-   Adapter 구현
-   테스트 완료
-   문서 업데이트

------------------------------------------------------------------------

# Claude Code Instructions

Prompt Engine은 자유 문자열 연결이 아니라 구조화된 Prompt Builder로
구현한다. 모델 교체 시 Adapter만 수정하면 되도록 설계한다. Safety
Layer는 항상 마지막 단계에서 적용한다.

End of Document
