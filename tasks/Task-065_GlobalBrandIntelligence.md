# Task-065_GlobalBrandIntelligence

**Project:** ASTER **Task ID:** TASK-065 **Title:** Global Brand
Intelligence **Priority:** P2 **Estimated Effort:** 10\~12 hours

------------------------------------------------------------------------

# Objective

국가, 문화, 언어, 산업별 브랜딩 특성을 분석하여 글로벌 시장에 적합한
브랜드 전략과 디자인 방향을 AI가 제안하는 Global Brand Intelligence를
구축한다.

------------------------------------------------------------------------

# Related Documents

-   Task-034_BrandKnowledgeGraph
-   Task-035_BrandReasoningEngine
-   Task-040_ASTERCopilot
-   Task-064_DesignKnowledgeLibrary
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 해외 시장을 대상으로 하는 브랜드를 설계할 때 국가와 문화에
맞는 전략을 추천받고 싶다.

------------------------------------------------------------------------

# Scope

포함 - 국가별 브랜딩 가이드 - 문화권 분석 - 언어별 네이밍 고려사항 -
글로벌 디자인 트렌드 - 시장별 추천 - 지역별 브랜드 인사이트

제외 - 법률 자문 - 자동 현지화 번역

------------------------------------------------------------------------

# Functional Requirements

-   국가 선택
-   문화권 프로파일
-   색상 문화 분석
-   타이포그래피 권장
-   시장별 디자인 추천
-   글로벌 리포트 생성

------------------------------------------------------------------------

# Workflow

Target Market → Cultural Analysis → Brand Intelligence → Design
Recommendation → Strategy Report

------------------------------------------------------------------------

# Backend Tasks

-   GlobalBrandService
-   CultureProfileManager
-   RegionalRecommendationEngine
-   TrendKnowledgeService

------------------------------------------------------------------------

# Frontend Tasks

-   Global Insights Dashboard
-   Country Selector
-   Culture Report Viewer
-   Recommendation Panel

------------------------------------------------------------------------

# API

GET /global/countries GET /global/insights POST /global/analyze

------------------------------------------------------------------------

# Database

-   country_profiles
-   cultural_guidelines
-   global_trends
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   국가별 분석
-   문화권 추천
-   글로벌 리포트 생성
-   AI 추천 연동

------------------------------------------------------------------------

# Test Checklist

-   국가 변경
-   문화권 분석
-   리포트 생성
-   추천 비교
-   권한 검증

------------------------------------------------------------------------

# Definition of Done

-   Global Intelligence 구현
-   리포트 UI 구현
-   AI 연동 완료
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Global Brand Intelligence는 문화적 차이를 일반적인 참고 정보로 제공한다.
추천은 시장 진출 전략을 보조하기 위한 것이며 최종 의사결정은 사용자에게
맡긴다. 국가별 데이터와 디자인 지식은 지속적으로 업데이트 가능한 구조로
설계한다.

End of Document
