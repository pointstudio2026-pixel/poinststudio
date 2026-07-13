# 13_PRD_AsterBrain

Project: ASTER Version: 3.0 (AI-Native Specification) Status: Draft

------------------------------------------------------------------------

# Feature ID

PRD-008

Feature Name

Aster Brain

Priority

P0 (Core Intelligence Engine)

------------------------------------------------------------------------

# Goal

Aster Brain은 ASTER의 핵심 추론 엔진이다.

단순히 텍스트를 요약하는 것이 아니라, 브랜드 정보를 이해하고 구조화하여
이후 모든 엔진이 사용할 수 있는 브랜드 지식(Brand Knowledge)을 생성한다.

------------------------------------------------------------------------

# Mission

입력(Input)을 브랜드 사고(Reasoning)로 변환한다.

출력(Output)은 이미지가 아니라 '브랜드 방향성'이다.

------------------------------------------------------------------------

# Inputs

-   Brand Interview
-   User Corrections
-   Brand Brief
-   Industry
-   Design Memory

------------------------------------------------------------------------

# Responsibilities

-   브랜드 정보 정규화
-   누락 정보 탐지
-   핵심 가치 추출
-   브랜드 성격 정의
-   타깃 고객 분석
-   시각적 방향성 제안
-   후속 엔진에 구조화된 데이터 전달

------------------------------------------------------------------------

# Reasoning Pipeline

1.  Validate Input
2.  Normalize Data
3.  Detect Missing Information
4.  Infer Brand Intent
5.  Build Brand Knowledge
6.  Generate Brand Brief
7.  Generate Brand Strategy
8.  Send to Style Engine

------------------------------------------------------------------------

# Output Contract

Brand Knowledge

-   Mission
-   Vision
-   Values
-   Positioning
-   Audience
-   Tone
-   Personality
-   Visual Direction
-   Confidence Notes
-   Reasoning Summary

------------------------------------------------------------------------

# AI Guardrails

-   특정 기업의 로고나 브랜드를 모방하지 않는다.
-   상표권 침해 가능성이 있는 요청은 일반적인 방향성으로 전환한다.
-   저작권 보호 대상 디자인을 재현하지 않는다.
-   추천에는 항상 이유를 제공한다.

------------------------------------------------------------------------

# Confidence Model

모든 추천은 신뢰 수준을 포함한다.

-   High
-   Medium
-   Low

Low인 경우 추가 질문을 제안한다.

------------------------------------------------------------------------

# API

POST /brain/analyze

POST /brain/reanalyze

GET /brain/{projectId}

------------------------------------------------------------------------

# Database

brand_knowledge brain_reasoning_logs brain_versions

------------------------------------------------------------------------

# Dependencies

Input Brand Interview ↓

Brand Brief ↓

Aster Brain

Outputs - Brand Strategy - Style Engine - Prompt Engine - Concept Board

------------------------------------------------------------------------

# Error Handling

BRAIN-001 Missing Input

BRAIN-002 Analysis Failed

BRAIN-003 Confidence Too Low

------------------------------------------------------------------------

# Acceptance Criteria

-   구조화된 Brand Knowledge 생성
-   Reasoning Summary 생성
-   Confidence 계산
-   후속 엔진으로 정상 전달

------------------------------------------------------------------------

# Definition of Done

-   Reasoning Engine 구현
-   API 구현
-   테스트 완료
-   문서 업데이트

------------------------------------------------------------------------

# Claude Code Instructions

Aster Brain은 단순 LLM 호출 함수가 아니다. 독립적인 Domain Service로
구현한다. 모든 출력은 구조화된 스키마(JSON)로 반환하며, 후속 엔진은 자유
텍스트가 아닌 해당 스키마를 사용한다.

End of Document
