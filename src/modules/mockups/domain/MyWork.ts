/**
 * "내 작업물" -- "새 프로젝트"(일반 생성)와 "목업"(단독 프로세스) 양쪽에서
 * 만든 모든 이미지를 한 화면에서 보여주기 위한 통합 항목. 두 소스의 도메인
 * 타입(PastGenerationImage/StandaloneMockup)이 서로 달라 화면에서 다루기
 * 편한 공통 모양으로 얇게 매핑한다 -- 별도 테이블/저장소를 새로 두지 않고
 * 기존 두 리포지토리를 그대로 재사용한다.
 */
export interface MyWorkItem {
  id: string;
  sourceType: "generation" | "standalone_mockup";
  imageUrl: string;
  thumbnailUrl: string;
  projectName: string;
  createdAt: Date;
}
