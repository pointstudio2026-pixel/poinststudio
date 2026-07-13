# Task-032_BrandConsistencyEngine

**Project:** ASTER **Task ID:** TASK-032 **Title:** Brand Consistency
Engine **Priority:** P2 **Estimated Effort:** 8\~10 hours

------------------------------------------------------------------------

# Objective

브랜드 전략, 스타일, 컬러, 타이포그래피, 로고 컨셉이 하나의 브랜드
방향성과 일관성을 유지하는지 자동 검증하는 Brand Consistency Engine을
구현한다.

------------------------------------------------------------------------

# Related Documents

-   10_PRD_BrandBrief.md
-   11_PRD_BrandStrategy.md
-   12_PRD_StyleEngine.md
-   13_PRD_AsterBrain.md
-   20_PRD_DesignMemory.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 생성된 결과들이 서로 어울리는지 빠르게 확인하고, 브랜드
일관성을 유지하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - 브랜드 일관성 검사 - 컬러 조화 분석 - 스타일 충돌 감지 - 톤앤매너
일치도 평가 - 개선 제안

제외 - 자동 수정 - 사용자 결과 강제 변경

------------------------------------------------------------------------

# Functional Requirements

-   Brand Brief 기준 검증
-   Style 충돌 감지
-   컬러 팔레트 적합성
-   Typography 방향성 검사
-   로고 컨셉 적합성
-   개선 포인트 제안

------------------------------------------------------------------------

# Workflow

Brand Brief → Strategy → Style → Design Assets → Consistency Analysis →
Report

------------------------------------------------------------------------

# Backend Tasks

-   BrandConsistencyUseCase
-   ConsistencyAnalyzer
-   ColorHarmonyService
-   TypographyEvaluator
-   RecommendationBuilder

------------------------------------------------------------------------

# Frontend Tasks

-   Consistency Score Card
-   Analysis Report
-   Improvement Suggestions
-   Comparison View

------------------------------------------------------------------------

# API

POST /consistency/analyze

GET /consistency/{projectId}

------------------------------------------------------------------------

# Database

-   consistency_reports
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   일관성 점수 생성
-   충돌 감지
-   개선 제안 표시
-   분석 이력 저장

------------------------------------------------------------------------

# Test Checklist

-   일관된 브랜드
-   상충되는 스타일
-   컬러 충돌
-   타이포 불일치
-   재분석

------------------------------------------------------------------------

# Definition of Done

-   Consistency Engine 구현
-   분석 UI 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Brand Consistency Engine은 결과를 자동 변경하지 않는다. 브랜드 방향성에
대한 분석과 제안만 제공하며, 최종 결정은 사용자에게 맡긴다. 분석 기준은
확장 가능한 Rule Engine 구조로 설계한다.

End of Document
