# 17_PRD_ConceptBoard

Project: ASTER Version: 3.0 (AI-Native Specification) Status: Draft

------------------------------------------------------------------------

# Feature ID

PRD-012

Feature Name

Concept Board

Priority

P0 (Designer Deliverable)

------------------------------------------------------------------------

# Goal

Concept Board는 ASTER가 생성한 브랜드 분석 결과를 하나의 시각적 보드로
정리하여 디자이너가 고객과 방향성을 공유할 수 있도록 한다.

최종 산출물은 디자인 완성본이 아니라 브랜드 방향성 문서이다.

------------------------------------------------------------------------

# Inputs

-   Approved Brand Brief
-   Approved Brand Strategy
-   Selected Style
-   Color Direction
-   Typography Direction
-   Symbol Direction
-   Generated Concept Images

------------------------------------------------------------------------

# Outputs

-   Concept Board
-   PDF Export
-   PNG Export
-   Share Link

------------------------------------------------------------------------

# Board Sections

## Brand Summary

-   Brand Name
-   Industry
-   Mission
-   Vision
-   Core Values

## Strategy

-   Positioning
-   Tone & Manner
-   Personality
-   Recommended Direction

## Visual Direction

-   Primary Style
-   Secondary Style
-   Keywords

## Color Palette

-   Primary
-   Secondary
-   Accent
-   Usage Notes

## Typography

-   Heading Direction
-   Body Direction
-   Font Characteristics

## Symbol Direction

-   Shape
-   Geometry
-   Complexity
-   Usage Notes

## Concept Images

-   Selected Concepts
-   Version History

## AI Reasoning

-   Why this direction?
-   Design Notes
-   Risks & Considerations

------------------------------------------------------------------------

# Workflow

Brand Brief → Brand Strategy → Style Engine → Image Generation → Concept
Board Build → User Review → Export

------------------------------------------------------------------------

# UI Components

-   Section Cards
-   Palette Preview
-   Typography Preview
-   Image Gallery
-   Export Panel
-   Share Button

------------------------------------------------------------------------

# Business Rules

-   사용자는 모든 섹션을 수정할 수 있다.
-   수정 시 새 버전 생성.
-   프로젝트마다 하나의 최신 Concept Board 유지.
-   PDF/PNG 내보내기 지원.

------------------------------------------------------------------------

# API

POST /concept-board/build

GET /concept-board/{projectId}

PATCH /concept-board/{projectId}

POST /concept-board/export

------------------------------------------------------------------------

# Database

concept_boards concept_board_versions exports

------------------------------------------------------------------------

# Error Handling

CB-001 Build Failed CB-002 Export Failed CB-003 Version Conflict

------------------------------------------------------------------------

# Acceptance Criteria

-   자동 생성 성공
-   편집 가능
-   PDF/PNG Export 성공
-   프로젝트와 버전 연결

------------------------------------------------------------------------

# Definition of Done

-   UI 구현
-   Export 구현
-   Version 관리
-   API 테스트
-   문서 업데이트

------------------------------------------------------------------------

# Claude Code Instructions

Concept Board는 단순 결과 화면이 아니라 고객 제안서 수준의 산출물로
구현한다. 모든 정보는 Brand Brief를 단일 기준으로 참조하며, 각 추천에는
설명을 포함한다.

End of Document
