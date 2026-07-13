# 11_PRD_BrandStrategy

Project: ASTER Version: 2.1 (AI-Native Specification) Status: Draft

------------------------------------------------------------------------

# Feature ID

PRD-006

Feature Name

Brand Strategy

Priority

P0 (Core Intelligence)

------------------------------------------------------------------------

# Goal

Brand Strategy는 Brand Brief를 기반으로 브랜드의 전략적 방향성을
생성한다.

이미지를 생성하기 전에 '왜 이런 방향이 적합한가'를 먼저 정의한다.

------------------------------------------------------------------------

# Inputs

-   Latest Brand Brief
-   Industry Knowledge
-   User Preferences (Design Memory)
-   Style Library Metadata

------------------------------------------------------------------------

# Outputs

## Strategy Profile

-   Brand Positioning
-   Core Message
-   Tone & Manner
-   Personality
-   Brand Archetype
-   Visual Direction
-   Recommended Styles
-   Recommended Colors
-   Recommended Typography
-   Recommended Symbols

모든 추천에는 이유를 포함한다.

------------------------------------------------------------------------

# Workflow

Latest Brand Brief → Aster Brain Analysis → Industry Context → Strategy
Generation → User Review → Approved Strategy → Style Engine

------------------------------------------------------------------------

# UI Layout

Left - Strategy Sections - Editable Fields

Center - AI Recommendations - Explanation Cards

Right - Related Style Suggestions - Notes - Version History

------------------------------------------------------------------------

# Business Rules

-   전략은 항상 Brand Brief 최신 버전을 기준으로 생성한다.
-   사용자가 수정하면 Strategy Version을 생성한다.
-   승인된 Strategy만 다음 엔진으로 전달한다.

------------------------------------------------------------------------

# AI Rules

-   특정 기업을 모방하지 않는다.
-   상표 식별성을 높이는 표현을 피한다.
-   업종 특성과 사용자 입력을 우선한다.
-   추천에는 반드시 근거를 제공한다.

------------------------------------------------------------------------

# API

POST /strategy/generate

GET /strategy/{projectId}

PATCH /strategy/{projectId}

POST /strategy/{projectId}/approve

------------------------------------------------------------------------

# Database

brand_strategies

brand_strategy_versions

strategy_explanations

------------------------------------------------------------------------

# Error Handling

STR-001 Strategy Generation Failed

STR-002 Invalid Brand Brief

STR-003 Approval Failed

------------------------------------------------------------------------

# Acceptance Criteria

-   Brand Brief 기반 전략 생성
-   모든 추천에 설명 제공
-   사용자 수정 가능
-   승인 후 Style Engine으로 전달

------------------------------------------------------------------------

# Definition of Done

-   UI 구현
-   AI 연동
-   버전 관리
-   API 테스트
-   문서 업데이트

------------------------------------------------------------------------

# Claude Code Instructions

Brand Strategy는 이미지 생성보다 먼저 실행한다. 추천 결과에는 항상 '추천
이유'를 포함한다. Style Engine은 승인된 Strategy만 입력으로 사용한다.

End of Document
