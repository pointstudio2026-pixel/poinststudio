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

export const NON_BRANDING_WORKSPACE_STEPS = [
  { key: "deliverable_type", label: "작업물 유형" },
  { key: "brand_interview", label: "브랜드 인터뷰" },
  { key: "style", label: "스타일" },
  { key: "generation", label: "이미지 생성" },
  { key: "concept_board", label: "컨셉 보드" },
  { key: "mockup", label: "목업" },
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
