# Task-066_MultilingualBrandEngine

**Project:** ASTER **Task ID:** TASK-066 **Title:** Multilingual Brand
Engine **Priority:** P2 **Estimated Effort:** 10\~12 hours

------------------------------------------------------------------------

# Objective

브랜드 전략, 네이밍, 슬로건, 브랜드 메시지를 여러 언어로 생성하고 언어별
뉘앙스와 문화적 맥락을 고려하는 Multilingual Brand Engine을 구축한다.

------------------------------------------------------------------------

# Related Documents

-   Task-035_BrandReasoningEngine
-   Task-040_ASTERCopilot
-   Task-064_DesignKnowledgeLibrary
-   Task-065_GlobalBrandIntelligence
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

브랜드를 해외 시장에 출시하는 디자이너로서 자연스럽고 현지 문화에 맞는
브랜드 메시지를 만들고 싶다.

------------------------------------------------------------------------

# Scope

포함 - 다국어 네이밍 - 슬로건 생성 - 브랜드 메시지 - 톤앤매너 유지 -
언어별 검토 - 번역 비교

제외 - 법률 번역 - 공인 번역 서비스

------------------------------------------------------------------------

# Functional Requirements

-   다국어 생성
-   언어별 스타일 유지
-   문화적 표현 고려
-   용어 일관성
-   비교 보기
-   언어별 버전 관리

------------------------------------------------------------------------

# Workflow

Brand Strategy → Language Selection → Localization → Quality Review →
Output

------------------------------------------------------------------------

# Backend Tasks

-   MultilingualBrandService
-   LocalizationEngine
-   TerminologyManager
-   TranslationQualityService

------------------------------------------------------------------------

# Frontend Tasks

-   Language Selector
-   Side-by-side Comparison
-   Terminology Viewer
-   Localization Report

------------------------------------------------------------------------

# API

POST /multilingual/generate GET /multilingual/projects/{projectId} GET
/multilingual/terminology

------------------------------------------------------------------------

# Database

-   multilingual_versions
-   terminology_entries
-   localization_reports
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   다국어 생성
-   용어 일관성 유지
-   비교 화면 제공
-   버전 저장

------------------------------------------------------------------------

# Test Checklist

-   언어 변경
-   슬로건 생성
-   용어 유지
-   비교 보기
-   권한 검증

------------------------------------------------------------------------

# Definition of Done

-   Multilingual Engine 구현
-   비교 UI 구현
-   품질 검증 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

언어별 결과는 직역보다 브랜드 의도와 톤앤매너를 우선 유지한다. 언어별
버전을 독립적으로 관리하며 공통 브랜드 전략과 연결한다. 모든 생성 결과는
사용자가 검토 및 수정할 수 있도록 제공한다.

End of Document
