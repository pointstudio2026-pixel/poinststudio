# Task-035_BrandReasoningEngine

**Project:** ASTER **Task ID:** TASK-035 **Title:** Brand Reasoning
Engine **Priority:** P2 **Estimated Effort:** 9\~12 hours

------------------------------------------------------------------------

# Objective

Brand Knowledge Graph와 Brand Brief를 기반으로 브랜드의 핵심 전략과
디자인 방향을 논리적으로 추론하는 Brand Reasoning Engine을 구현한다.

Reasoning Engine은 단순 텍스트 생성이 아니라 근거 기반 추론을 수행하여
Aster Brain, Style Engine, Prompt Engine에 일관된 의사결정 데이터를
제공한다.

------------------------------------------------------------------------

# Related Documents

-   10_PRD_BrandBrief.md
-   11_PRD_BrandStrategy.md
-   13_PRD_AsterBrain.md
-   20_PRD_DesignMemory.md
-   22_DatabaseArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 AI가 어떤 이유로 특정 전략과 스타일을 추천했는지 이해하고,
필요할 경우 그 근거를 검토하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - 브랜드 전략 추론 - 근거(Evidence) 생성 - 추론 규칙 관리 - 신뢰도
계산 - 대안 전략 생성 - 추론 버전 관리

제외 - 자동 승인 - 사용자 의사결정 대체

------------------------------------------------------------------------

# Functional Requirements

-   Knowledge Graph 기반 추론
-   Evidence 생성
-   Recommendation 이유 설명
-   Confidence Score 계산
-   대안 전략 제시
-   추론 결과 버전 저장

------------------------------------------------------------------------

# Workflow

Brand Brief → Knowledge Graph → Reasoning Engine → Evidence Builder →
Strategy Recommendation → Aster Brain

------------------------------------------------------------------------

# Backend Tasks

-   BrandReasoningUseCase
-   ReasoningRuleEngine
-   EvidenceBuilder
-   ConfidenceCalculator
-   RecommendationComposer

------------------------------------------------------------------------

# Frontend Tasks

-   Reasoning Report
-   Evidence Viewer
-   Confidence Indicator
-   Alternative Strategy Panel

------------------------------------------------------------------------

# API

POST /reasoning/execute

GET /reasoning/{projectId}

GET /reasoning/{projectId}/evidence

------------------------------------------------------------------------

# Database

-   reasoning_results
-   reasoning_versions
-   reasoning_evidence
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   전략 추론 성공
-   근거 생성
-   신뢰도 계산
-   대안 전략 제공
-   버전 저장

------------------------------------------------------------------------

# Test Checklist

-   브랜드 정보 충분
-   브랜드 정보 부족
-   상충되는 입력
-   재추론
-   버전 비교
-   권한 검증

------------------------------------------------------------------------

# Definition of Done

-   Brand Reasoning Engine 구현
-   Evidence 시스템 구현
-   Reasoning Report UI 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Reasoning Engine은 추론 결과뿐 아니라 근거(Evidence)를 반드시 생성한다.
모든 추천은 설명 가능해야 하며(Explainable AI), 추론 규칙과 AI 결과를
함께 활용한다. 추론 과정은 버전 관리하고 향후 규칙을 쉽게 확장할 수 있는
구조로 구현한다.

End of Document
