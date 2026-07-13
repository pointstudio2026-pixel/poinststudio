# Task-010_AsterBrainExecution

**Project:** ASTER **Task ID:** TASK-010 **Title:** Aster Brain
Execution Engine **Priority:** P0 **Estimated Effort:** 6\~8 hours

------------------------------------------------------------------------

# Objective

Aster Brain은 Brand Brief를 분석하여 브랜드 전략의 핵심 정보를 추론하는
ASTER의 핵심 AI 엔진이다.

이 Task에서는 Brand Brief를 입력받아 Brand Strategy, Style Engine,
Prompt Engine이 공통으로 사용할 구조화된 Brand Knowledge를 생성한다.

------------------------------------------------------------------------

# Related Documents

-   10_PRD_BrandBrief.md
-   11_PRD_BrandStrategy.md
-   12_PRD_StyleEngine.md
-   13_PRD_AsterBrain.md
-   14_PRD_PromptEngine.md
-   21_PRD_APIContract.md
-   22_DatabaseArchitecture.md
-   25_AIProviderArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 인터뷰 내용을 다시 해석할 필요 없이, AI가 브랜드의 핵심
방향성과 디자인 인사이트를 먼저 정리해주기를 원한다.

------------------------------------------------------------------------

# Scope

포함 - Brand Brief 분석 - Brand Knowledge 생성 - Brand Strategy 초안
생성 - Style 후보 추출 - Confidence Score 계산 - 결과 저장 및 버전 관리

제외 - 최종 이미지 생성 - 목업 생성 - 사용자 결제 처리

------------------------------------------------------------------------

# Workflow

Brand Brief → Aster Brain → Brand Knowledge → Brand Strategy Draft →
Style Candidates → Prompt Engine Input

------------------------------------------------------------------------

# Functional Requirements

-   브랜드 핵심 가치 추출
-   타깃 고객 분석
-   경쟁 포지셔닝 요약
-   Tone & Personality 정의
-   디자인 키워드 생성
-   Style Engine 입력 데이터 생성
-   신뢰도(Confidence) 계산

------------------------------------------------------------------------

# Output Schema

``` json
{
  "brandKnowledge": {},
  "brandStrategy": {},
  "styleCandidates": [],
  "confidence": 0.92
}
```

------------------------------------------------------------------------

# Backend Tasks

-   ExecuteAsterBrainUseCase
-   BrandKnowledgeBuilder
-   StrategyComposer
-   ConfidenceCalculator
-   ResultVersionManager

------------------------------------------------------------------------

# Frontend Tasks

-   Analysis Progress UI
-   Strategy Preview
-   Confidence Indicator
-   Retry Analysis Button

------------------------------------------------------------------------

# API

POST /aster-brain/execute

GET /aster-brain/{projectId}

POST /aster-brain/rebuild

------------------------------------------------------------------------

# Database

-   brand_strategies
-   brand_strategy_versions
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   Brand Knowledge 생성
-   Brand Strategy 초안 생성
-   Style 후보 반환
-   버전 저장
-   신뢰도 계산

------------------------------------------------------------------------

# Test Checklist

-   정상 분석
-   Brand Brief 누락
-   AI Provider 오류
-   재분석
-   버전 비교
-   권한 검증

------------------------------------------------------------------------

# Files Expected

Backend - modules/aster-brain/ - modules/brand-strategies/

Frontend - features/aster-brain/ - components/strategy/

Tests - unit - integration - e2e

------------------------------------------------------------------------

# Definition of Done

-   Aster Brain 구현
-   Strategy 생성
-   Version 저장
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Aster Brain은 ASTER의 핵심 추론 엔진이다. Brand Brief를 유일한 입력으로
사용하며, 후속 엔진은 Brand Knowledge를 참조한다. AI 호출은 Provider
Router를 통해 수행하고 결과는 버전 관리한다. Use Case, Repository,
Adapter 패턴을 준수하며 관련 설계 문서를 먼저 읽고 구현한다.

End of Document
