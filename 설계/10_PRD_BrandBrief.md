# 10_PRD_BrandBrief

Project: ASTER Version: 2.1 (AI-Native Specification) Status: Draft

------------------------------------------------------------------------

# Feature ID

PRD-005

Feature Name

Brand Brief

Priority

P0 (Core Data Model)

------------------------------------------------------------------------

# Goal

Brand Brief는 ASTER의 Single Source of Truth이다.

모든 AI 엔진은 Brand Brief를 기준으로 동작하며, 브랜드 관련 데이터는
Brand Brief를 중심으로 관리한다.

------------------------------------------------------------------------

# Purpose

Brand Brief는 단순 입력 데이터가 아니다.

Brand Interview와 Aster Brain이 함께 생성한 구조화된 브랜드 정의서이며,
모든 후속 기능의 입력 데이터가 된다.

------------------------------------------------------------------------

# Inputs

-   Interview Result
-   사용자 수정 내용
-   업종 정보
-   브랜드명

------------------------------------------------------------------------

# Data Schema

## Basic

-   Brand Name
-   Industry
-   Tagline
-   Description

## Brand Core

-   Mission
-   Vision
-   Core Values
-   Positioning

## Audience

-   Primary Audience
-   Secondary Audience
-   Customer Problems
-   Desired Impression

## Personality

-   Brand Tone
-   Brand Personality
-   Keywords
-   Avoid Keywords

## Visual Direction

-   Preferred Style
-   Preferred Color
-   Preferred Symbol
-   Typography Direction

------------------------------------------------------------------------

# Editable Fields

모든 항목은 사용자가 수정할 수 있어야 한다.

수정 시 새로운 Brand Brief Version을 생성한다.

------------------------------------------------------------------------

# Version Control

V1 → 사용자 수정 → V2

V2 → AI 재분석 → V3

모든 버전은 복원 가능해야 한다.

------------------------------------------------------------------------

# Dependencies

Brand Interview ↓

Aster Brain ↓

Brand Brief

Brand Brief는 다음 엔진의 입력값이다.

-   Brand Strategy
-   Style Engine
-   Prompt Engine
-   Image Generation
-   Concept Board
-   Mockup

------------------------------------------------------------------------

# UI Components

-   Section Navigation
-   Inline Editor
-   Version Timeline
-   AI Suggestion Panel
-   Save Indicator

------------------------------------------------------------------------

# API

GET /brand-brief/{projectId}

PATCH /brand-brief/{projectId}

POST /brand-brief/{projectId}/version

GET /brand-brief/{projectId}/history

------------------------------------------------------------------------

# Database

brand_briefs

brand_brief_versions

brand_brief_history

------------------------------------------------------------------------

# Business Rules

-   Brand Brief는 프로젝트당 하나 존재한다.
-   수정 시 자동 저장한다.
-   주요 변경 시 새 버전을 생성한다.
-   모든 엔진은 최신 버전을 사용한다.

------------------------------------------------------------------------

# Error Handling

BB-001 Brief Not Found

BB-002 Save Failed

BB-003 Version Conflict

------------------------------------------------------------------------

# Acceptance Criteria

-   Brand Brief 생성
-   사용자 수정 가능
-   버전 관리 동작
-   후속 엔진 입력으로 정상 전달

------------------------------------------------------------------------

# Definition of Done

-   UI 구현
-   Backend 구현
-   Version 관리 구현
-   API 테스트
-   문서 업데이트

------------------------------------------------------------------------

# Claude Code Instructions

Brand Brief를 ASTER의 단일 진실 공급원(Single Source of Truth)으로
구현한다. 다른 엔진은 Brand Brief를 직접 참조하며 동일한 브랜드 데이터를
중복 저장하지 않는다. Versioning 구조를 기본으로 구현한다.

End of Document
