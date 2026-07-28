import { isBrandingDeliverableType } from "@/modules/projects/domain/deliverableTypes";

export interface Project {
  id: string;
  userId: string;
  name: string;
  status: string;
  deliverableType: string | null;
  currentStep: string;
  isFavorite: boolean;
  sharedWithTeam: boolean;
  /** "목업" 단독 프로세스가 만드는 껍데기 프로젝트 -- "새 프로젝트" 목록에는 절대 안 보여야 한다. */
  isStandaloneMockup: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// 08_PRD_ProjectWorkspace.md Left Sidebar / Core Workflow order. 브랜드
// 브리프 단계는 제거되었다 -- 브랜드 전략과 내용이 거의 전부 겹쳐서
// (brandKnowledgeRules.ts 참고) 별도 화면 없이 브랜드 전략 생성 시
// 인터뷰 답변에서 바로 추론한다. 스타일은 브랜드 전략보다 먼저 선택한다.
// 브랜드 전략 확정 후 곧바로 이미지를 생성하지 않고, "로고 스타일 선택"
// (워드마크/심볼/일러스트/조합형/프리미엄 -- 로고의 구조적 형태) 단계를
// 반드시 거친다. 스타일(무드)과는 다른 축이라 별도 단계로 분리했다.
//
// "작업물 유형"은 가장 먼저 묻는 단계이며, 그 답에 따라 "브랜드 전략"/
// "로고 스타일" 단계 자체가 존재할지가 갈린다 -- 두 단계는 "브랜딩 & 로고"
// 유형에만 의미가 있다(logo/brand-identity 전용 개념). 다른 유형은 스타일
// 선택 후 곧바로 이미지 생성으로 넘어간다.
export const BRANDING_WORKSPACE_STEPS = [
  { key: "deliverable_type", label: "작업물 유형" },
  { key: "brand_interview", label: "브랜드 인터뷰" },
  { key: "style", label: "스타일" },
  { key: "brand_strategy", label: "브랜드 전략" },
  { key: "logo_style", label: "로고 스타일" },
  { key: "generation", label: "이미지 생성" },
  { key: "concept_board", label: "컨셉 보드" },
  { key: "mockup", label: "목업" },
] as const;

// 2026-07-25 사용자 결정: 브랜딩 & 로고를 제외한 작업물 유형은 별도 목업
// 스튜디오 단계가 필요 없다 -- 생성 자체가 이미 완성된 목업 사진 형태로
// 나오도록 프롬프트가 바뀌었기 때문(promptBuilder.ts의 DELIVERABLE_OBJECTIVES
// 참고). 그래서 이 목록에는 "mockup" 단계가 없다(브랜딩 & 로고만 갖는다).
//
// "로고 선택"(logo_choice)은 "style"과 "generation" 사이에 끼워 넣는다 --
// 디자이너가 이미 만들어둔 실제 로고를 첨부해서 그대로 목업에 합성할지,
// 아니면 지금처럼 AI가 상호명만 보고 전부 상상해서 그리게 둘지 고르는
// 단계다(ProjectLogoAsset/GenerateFromLogoAssetUseCase 참고). SelectStyleUseCase는
// 배열 위치로만 다음 단계를 찾으므로 이 배열에 추가하는 것만으로 자동
// 연결된다.
export const NON_BRANDING_WORKSPACE_STEPS = [
  { key: "deliverable_type", label: "작업물 유형" },
  { key: "brand_interview", label: "브랜드 인터뷰" },
  { key: "style", label: "스타일" },
  { key: "logo_choice", label: "로고 선택" },
  { key: "generation", label: "이미지 생성" },
  { key: "concept_board", label: "컨셉 보드" },
] as const;

/**
 * `null`/`undefined`(레거시 프로젝트, 아직 유형 미선택)와 "브랜딩 & 로고"는
 * 모두 전체 8단계 목록을 쓴다 -- 데이터 마이그레이션 없이 하위호환을 보장한다.
 */
export function getWorkspaceSteps(
  deliverableType: string | null | undefined,
): typeof BRANDING_WORKSPACE_STEPS | typeof NON_BRANDING_WORKSPACE_STEPS {
  return isBrandingDeliverableType(deliverableType) ? BRANDING_WORKSPACE_STEPS : NON_BRANDING_WORKSPACE_STEPS;
}
