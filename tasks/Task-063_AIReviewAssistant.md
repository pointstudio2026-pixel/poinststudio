# Task-063_AIReviewAssistant

**Project:** ASTER **Task ID:** TASK-063 **Title:** AI Review Assistant
**Priority:** P2 **Estimated Effort:** 9\~11 hours

------------------------------------------------------------------------

# Objective

AI가 디자인 결과물을 검토하여 브랜드 일관성, 접근성, 시각적 완성도,
가독성 및 개선 포인트를 분석하고 리뷰 의견을 제공하는 기능을 구축한다.

------------------------------------------------------------------------

# Related Documents

-   Task-031_AIQualityEvaluation
-   Task-032_BrandConsistencyEngine
-   Task-035_BrandReasoningEngine
-   Task-040_ASTERCopilot
-   Task-062_CollaborationIntelligence
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 결과물을 제출하기 전에 AI의 리뷰를 받아 품질을 향상시키고
싶다.

------------------------------------------------------------------------

# Scope

포함 - 디자인 리뷰 - 브랜드 일관성 분석 - 접근성 검사 - 시각적 계층 구조
분석 - 개선 제안 - 리뷰 리포트

제외 - 자동 디자인 수정 - 최종 승인 대체

------------------------------------------------------------------------

# Functional Requirements

-   로고 검토
-   컬러 사용 분석
-   타이포그래피 평가
-   레이아웃 평가
-   접근성 검사
-   개선 우선순위 제안

------------------------------------------------------------------------

# Workflow

Design Upload → AI Analysis → Quality Evaluation → Brand Consistency
Check → Review Report → Improvement Suggestions

------------------------------------------------------------------------

# Backend Tasks

-   ReviewAssistantService
-   VisualAnalyzer
-   AccessibilityEvaluator
-   RecommendationEngine
-   ReviewReportGenerator

------------------------------------------------------------------------

# Frontend Tasks

-   Review Dashboard
-   Score Cards
-   Annotation Panel
-   Improvement Checklist
-   Export Report

------------------------------------------------------------------------

# API

POST /review/analyze GET /review/{projectId} GET
/review/report/{reviewId}

------------------------------------------------------------------------

# Database

-   review_reports
-   review_annotations
-   review_scores
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   리뷰 생성
-   품질 점수 제공
-   개선 제안 표시
-   리포트 저장

------------------------------------------------------------------------

# Test Checklist

-   로고 리뷰
-   접근성 검사
-   브랜드 일관성
-   리포트 생성
-   권한 검증

------------------------------------------------------------------------

# Definition of Done

-   AI Review Assistant 구현
-   리뷰 UI 구현
-   리포트 Export 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

AI Review Assistant는 평가와 개선 제안만 제공한다. 사용자의 디자인를
자동 변경하지 않는다. 모든 리뷰는 근거와 점수를 함께 제공하며 최종
판단은 사용자에게 맡긴다.

End of Document
