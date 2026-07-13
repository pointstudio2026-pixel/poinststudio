# Task-064_DesignKnowledgeLibrary

**Project:** ASTER **Task ID:** TASK-064 **Title:** Design Knowledge
Library **Priority:** P2 **Estimated Effort:** 9\~11 hours

------------------------------------------------------------------------

# Objective

브랜드 사례, 디자인 패턴, 컬러 조합, 타이포그래피 규칙, 레이아웃 원칙
등을 체계적으로 관리하는 Design Knowledge Library를 구축하여 AI 추천
품질을 향상시킨다.

------------------------------------------------------------------------

# Related Documents

-   Task-032_BrandConsistencyEngine
-   Task-034_BrandKnowledgeGraph
-   Task-035_BrandReasoningEngine
-   Task-040_ASTERCopilot
-   Task-063_AIReviewAssistant
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 검증된 디자인 사례와 원칙을 참고하여 더 빠르고 일관된
결과를 만들고 싶다.

------------------------------------------------------------------------

# Scope

포함 - Design Pattern Library - Color Knowledge - Typography Rules -
Layout Patterns - Industry References - Search & Tagging

제외 - 저작권이 있는 원본 디자인 배포 - 외부 데이터 자동 수집

------------------------------------------------------------------------

# Functional Requirements

-   카테고리 관리
-   태그 검색
-   업종별 사례
-   컬러 조합 추천
-   타이포그래피 가이드
-   북마크 및 즐겨찾기

------------------------------------------------------------------------

# Workflow

Knowledge Entry → Validation → Classification → Indexing → Search → AI
Recommendation

------------------------------------------------------------------------

# Backend Tasks

-   KnowledgeLibraryService
-   TaxonomyManager
-   SearchIndexer
-   RecommendationAdapter
-   BookmarkService

------------------------------------------------------------------------

# Frontend Tasks

-   Knowledge Browser
-   Search Interface
-   Pattern Viewer
-   Bookmark Panel
-   Related Content

------------------------------------------------------------------------

# API

GET /knowledge GET /knowledge/search GET /knowledge/{itemId} POST
/knowledge/bookmarks

------------------------------------------------------------------------

# Database

-   knowledge_items
-   knowledge_tags
-   bookmarks
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   지식 검색
-   태그 필터
-   북마크 저장
-   AI 추천 연동

------------------------------------------------------------------------

# Test Checklist

-   검색
-   태그 필터
-   업종별 조회
-   북마크
-   권한 검증

------------------------------------------------------------------------

# Definition of Done

-   Knowledge Library 구현
-   검색 기능 구현
-   AI 연동 완료
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Design Knowledge Library는 검증된 디자인 원칙과 사례를 구조화하여
관리한다. AI는 라이브러리를 참고 자료로 활용하되 그대로 복제하지 않는다.
모든 콘텐츠는 메타데이터와 태그 기반으로 검색 가능하게 구현한다.

End of Document
