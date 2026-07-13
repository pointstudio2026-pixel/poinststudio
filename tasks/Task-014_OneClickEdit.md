# Task-014_OneClickEdit

**Project:** ASTER **Task ID:** TASK-014 **Title:** One Click Edit
**Priority:** P0 **Estimated Effort:** 6\~8 hours

------------------------------------------------------------------------

# Objective

사용자가 생성된 로고 컨셉 이미지를 선택한 뒤 복잡한 프롬프트 없이 원클릭
버튼만으로 새로운 디자인 버전을 생성할 수 있도록 구현한다.

이 기능은 ASTER의 핵심 차별화 요소이며, "프롬프트보다 브랜드 사고를 먼저
설계한다"는 제품 철학을 그대로 반영한다.

------------------------------------------------------------------------

# Related Documents

-   15_PRD_ImageGeneration.md
-   16_PRD_OneClickEdit.md
-   17_PRD_ConceptBoard.md
-   20_PRD_DesignMemory.md
-   25_AIProviderArchitecture.md
-   26_QueueAndJobArchitecture.md
-   30_CLAUDE.md

------------------------------------------------------------------------

# User Story

디자이너로서 프롬프트를 다시 작성하지 않고도 버튼 하나로 원하는 방향으로
디자인을 빠르게 발전시키고 싶다.

------------------------------------------------------------------------

# Scope

포함 - 원클릭 수정 버튼 - 수정 옵션 라이브러리 - 수정 프리셋 - AI Edit
Queue - 수정 이력 - 버전 비교

제외 - 자유 프롬프트 편집 - 목업 생성 - Export

------------------------------------------------------------------------

# Functional Requirements

-   이미지 선택 후 수정 실행
-   다중 수정 옵션 지원
-   수정 결과를 새 버전으로 저장
-   원본 이미지 보존
-   수정 이력 조회
-   Design Memory 반영

------------------------------------------------------------------------

# Default Edit Actions

-   심플하게
-   더 고급스럽게
-   더 미니멀하게
-   더 역동적으로
-   컬러 변경
-   타이포 강조
-   아이콘만 수정
-   심볼만 수정
-   레이아웃 변경
-   다시 생성

------------------------------------------------------------------------

# Workflow

Generation Result → Select Image → One Click Action → Edit Queue →
Provider Router → New Version → Version History

------------------------------------------------------------------------

# API

POST /edits

GET /edits/{generationId}

POST /edits/{generationId}/retry

------------------------------------------------------------------------

# Database

-   edit_history
-   generation_versions
-   design_memory
-   activity_logs

------------------------------------------------------------------------

# Backend Tasks

-   CreateEditUseCase
-   EditPresetService
-   EditWorker
-   VersionManager
-   UsageRecorder

------------------------------------------------------------------------

# Frontend Tasks

-   One Click Toolbar
-   Edit Progress
-   Version Comparison
-   Before / After Slider
-   History Drawer

------------------------------------------------------------------------

# Acceptance Criteria

-   원클릭 수정 성공
-   새 버전 생성
-   원본 유지
-   수정 이력 저장
-   Design Memory 반영

------------------------------------------------------------------------

# Test Checklist

-   모든 프리셋 동작
-   연속 수정
-   Provider 실패
-   Queue 재시도
-   버전 비교
-   권한 검증

------------------------------------------------------------------------

# Files Expected

Backend - modules/edits/ - workers/

Frontend - features/edits/ - components/edits/

Tests - unit - integration - e2e

------------------------------------------------------------------------

# Definition of Done

-   One Click Edit 구현
-   Edit Queue 연동
-   Version 관리
-   테스트 통과
-   타입 오류 없음
-   Lint 통과

------------------------------------------------------------------------

# Claude Code Execution Prompt

One Click Edit는 프롬프트 입력을 요구하지 않는다. 선택된 Edit Action을
Prompt Engine과 결합하여 새로운 Generation Version을 생성한다. 모든
수정은 원본을 덮어쓰지 않고 새로운 버전으로 저장한다. Design Memory에
사용자의 선호 수정 패턴을 기록한다.

End of Document
