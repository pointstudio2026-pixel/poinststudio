# 09_PRD_BrandInterview

Project: ASTER Version: 2.0 (AI-Native Specification) Status: Draft

------------------------------------------------------------------------

# Feature ID

PRD-004

Feature Name

AI Brand Interview

Priority

P0 (Core Differentiator)

------------------------------------------------------------------------

# Goal

AI Brand Interview는 단순 입력 폼이 아니라 브랜드를 이해하기 위한
인터뷰를 진행하여 구조화된 Brand Brief를 생성하는 것을 목표로 한다.

------------------------------------------------------------------------

# Product Philosophy

사용자는 프롬프트를 작성하지 않는다.

AI가 질문하고, 사용자는 답변하며, ASTER는 브랜드를 이해한다.

------------------------------------------------------------------------

# Inputs

필수 - 브랜드명 - 업종

선택 - 기존 브랜드 설명 - 웹사이트 - 슬로건

------------------------------------------------------------------------

# Interview Flow

1.  기본 정보 확인
2.  브랜드 목적
3.  핵심 가치
4.  타깃 고객
5.  경쟁 환경
6.  원하는 브랜드 인상
7.  피하고 싶은 이미지
8.  최종 검토

------------------------------------------------------------------------

# Dynamic Questions

질문은 업종에 따라 변경된다.

예시

카페 - 어떤 분위기를 전달하고 싶습니까? - 대표 메뉴는 무엇입니까?

노무법인 - 가장 중요한 신뢰 요소는 무엇입니까? - 기업 고객과 근로자 중
주 고객은 누구입니까?

뷰티 브랜드 - 프리미엄/대중형 중 어느 방향입니까? - 주요 고객 연령대는?

------------------------------------------------------------------------

# UI Components

-   Progress Stepper
-   Question Card
-   Answer Input
-   Choice Chips
-   Skip Button
-   Next Button
-   AI Summary Panel

------------------------------------------------------------------------

# State Machine

Idle → Asking → Answering → Summarizing → Completed

------------------------------------------------------------------------

# Output Schema

Interview Result

-   Brand Name
-   Industry
-   Purpose
-   Core Values
-   Target Audience
-   Brand Personality
-   Tone
-   Avoid Keywords
-   User Notes

------------------------------------------------------------------------

# AI Sequence

사용자 답변 → Aster Brain 분석 → 누락 정보 확인 → 추가 질문(필요 시) →
Interview Result 생성 → Brand Brief 생성 요청

------------------------------------------------------------------------

# Business Rules

-   질문 수는 기본 5\~8개
-   추가 질문은 최대 3개
-   사용자는 언제든 이전 질문 수정 가능
-   자동 저장 활성화

------------------------------------------------------------------------

# API

POST /interview/start POST /interview/answer GET /interview/state POST
/interview/complete

------------------------------------------------------------------------

# Database

interviews interview_answers brand_briefs

------------------------------------------------------------------------

# Error Handling

INT-001 Interview Expired INT-002 Invalid Answer INT-003 AI Timeout
INT-004 Save Failed

------------------------------------------------------------------------

# Acceptance Criteria

-   업종별 질문 변경
-   답변 자동 저장
-   Interview Result 생성
-   Brand Brief 전달 성공

------------------------------------------------------------------------

# Definition of Done

-   UI 구현
-   AI 인터뷰 플로우 구현
-   API 연동
-   자동 저장 테스트
-   문서 업데이트

------------------------------------------------------------------------

# Claude Code Instructions

-   인터뷰는 정적인 설문이 아닌 AI 기반 대화형 구조로 구현한다.
-   질문은 업종과 이전 답변에 따라 동적으로 변경 가능해야 한다.
-   출력은 반드시 Brand Brief 입력 스키마를 만족해야 한다.

End of Document
