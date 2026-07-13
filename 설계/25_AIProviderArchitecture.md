# 25_AIProviderArchitecture

**Project:** ASTER **Document:** AI Provider Architecture **Version:**
4.0 **Status:** Draft

------------------------------------------------------------------------

# Purpose

ASTER는 특정 AI 제공업체에 종속되지 않는다. 모든 AI 호출은 Provider
Adapter를 통해 수행하며, 새로운 모델은 기존 비즈니스 로직 변경 없이
추가할 수 있다.

------------------------------------------------------------------------

# Objectives

-   Provider 독립성
-   비용 최적화
-   장애 자동 대응
-   품질 유지
-   모델 교체 용이성

------------------------------------------------------------------------

# Supported Providers

-   OpenAI
-   Google Gemini
-   Nano Banana
-   Future Providers

------------------------------------------------------------------------

# Architecture

``` text
Brand Brief
    ↓
Brand Strategy
    ↓
Style Engine
    ↓
Prompt Engine
    ↓
Provider Router
    ↓
Provider Adapter
    ↓
AI Provider
```

------------------------------------------------------------------------

# Adapter Contract

모든 Provider는 동일한 인터페이스를 구현한다.

``` ts
interface AIProvider {
  generate(input: GenerationInput): Promise<GenerationResult>;
  edit(input: EditInput): Promise<GenerationResult>;
  health(): Promise<boolean>;
}
```

------------------------------------------------------------------------

# Routing Strategy

우선순위

1.  기능 지원 여부
2.  품질
3.  예상 비용
4.  응답 속도
5.  현재 장애 여부

Router는 최적의 Provider를 자동 선택한다.

------------------------------------------------------------------------

# Failover

-   Timeout 발생 시 대체 Provider
-   반복 실패 시 Circuit Breaker
-   장애 로그 기록

------------------------------------------------------------------------

# Cost Management

-   요청별 예상 비용 계산
-   실제 비용 기록
-   사용자 플랜 반영
-   목표 원가율 20% 이하 유지

------------------------------------------------------------------------

# Safety Layer

Provider 호출 전 반드시 수행

-   저작권 위험 검토
-   상표 모방 요청 일반화
-   정책 위반 요청 차단

------------------------------------------------------------------------

# Metrics

수집 항목

-   Provider
-   Model
-   Latency
-   Success Rate
-   Cost
-   Token Usage
-   Failure Rate

------------------------------------------------------------------------

# API

POST /provider/generate POST /provider/edit GET /provider/health

------------------------------------------------------------------------

# Database

provider_logs provider_metrics provider_costs

------------------------------------------------------------------------

# Acceptance Criteria

-   Provider 교체 가능
-   자동 Failover
-   비용 추적
-   Health Check 동작
-   공통 인터페이스 유지

------------------------------------------------------------------------

# Definition of Done

-   Provider Router 구현
-   Adapter 구현
-   비용 로깅 구현
-   Health Monitor 구현
-   테스트 완료

------------------------------------------------------------------------

# Claude Code Instructions

1.  비즈니스 로직은 Provider SDK를 직접 호출하지 않는다.
2.  모든 AI 호출은 Router → Adapter를 거친다.
3.  Provider 추가 시 기존 Use Case를 수정하지 않는다.
4.  비용과 성능 메트릭을 모든 호출에 기록한다.

End of Document
