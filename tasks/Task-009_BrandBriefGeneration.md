# Task-009_BrandBriefGeneration

**Project:** ASTER **Task ID:** TASK-009 **Title:** Brand Brief
Generation **Priority:** P0 **Estimated Effort:** 5\~6 hours

------------------------------------------------------------------------

# Objective

Brand Interview 결과를 기반으로 구조화된 Brand Brief를 생성한다.

Brand Brief는 ASTER의 Single Source of Truth이며 이후 Brand Strategy,
Style Engine, Prompt Engine, Image Generation의 입력 데이터가 된다.

------------------------------------------------------------------------

# Related Documents

-   09_PRD_BrandInterview.md
-   10_PRD_BrandBrief.md
-   11_PRD_BrandStrategy.md
-   13_PRD_AsterBrain.md
-   21_PRD_APIContract.md
-   22_DatabaseArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 인터뷰 답변이 자동으로 정리되어 브랜드 방향성을 한눈에
확인하고 수정하고 싶다.

------------------------------------------------------------------------

# Scope

포함 - Interview → Brand Brief 변환 - AI 구조화 - Brand Brief Version
생성 - 사용자 수정 - Version History

제외 - Brand Strategy 생성 - Style 추천 - 이미지 생성

------------------------------------------------------------------------

# Functional Requirements

-   인터뷰 답변 분석
-   Mission, Vision, Core Values 추출
-   Target Audience 정리
-   Tone & Personality 정의
-   Visual Direction 초안 생성
-   Version 생성 및 복원

------------------------------------------------------------------------

# Workflow

Interview Complete → Aster Brain Analysis → Brand Brief Draft → User
Review → Save Version → Approved Brand Brief

------------------------------------------------------------------------

# Backend Tasks

-   GenerateBrandBriefUseCase
-   BrandBriefRepository
-   VersionManager
-   UpdateBrandBriefUseCase

------------------------------------------------------------------------

# Frontend Tasks

-   Brand Brief 화면
-   Inline Edit
-   Version Timeline
-   AI Suggestion Panel
-   Save Indicator

------------------------------------------------------------------------

# API

POST /brand-brief/generate

GET /brand-brief/{projectId}

PATCH /brand-brief/{projectId}

POST /brand-brief/{projectId}/version

------------------------------------------------------------------------

# Database

-   brand_briefs
-   brand_brief_versions
-   activity_logs

------------------------------------------------------------------------

# Acceptance Criteria

-   Brand Brief 자동 생성
-   사용자 수정 가능
-   버전 생성
-   복원 가능
-   최신 버전 유지

------------------------------------------------------------------------

# Test Checklist

-   정상 생성
-   인터뷰 정보 부족
-   버전 생성
-   버전 복원
-   수정 후 저장
-   권한 없는 접근

------------------------------------------------------------------------

# Files Expected

Backend - modules/brand-briefs/

Frontend - features/brand-brief/ - components/brand-brief/

Tests - unit - integration - e2e

------------------------------------------------------------------------

# Definition of Done

-   Brand Brief 생성
-   Version 관리
-   UI 구현
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

Brand Brief는 ASTER의 단일 진실 공급원(Single Source of Truth)이다.
인터뷰 데이터를 직접 사용하지 말고 Brand Brief를 중심으로 후속 기능을
연결한다. Versioning은 덮어쓰기가 아닌 신규 버전 생성 방식으로 구현한다.
관련 설계 문서를 먼저 읽고 구현한다.

End of Document
