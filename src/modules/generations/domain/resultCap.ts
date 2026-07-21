import type { GenerationVersion } from "@/modules/generations/domain/Generation";

/**
 * 프로젝트(하나의 Generation 체인)당 최대 결과 개수 -- 로딩 시간을 줄이기
 * 위해 최초 생성은 1장만 만들고(ProcessGenerationJobUseCase), 그 대신 이
 * 한도까지 "원클릭 수정" 프리셋 버튼으로 결과를 추가할 수 있게 했다.
 */
export const MAX_PROJECT_RESULTS = 3;

/**
 * `failed`만 캡에서 제외한다(재시도가 막히지 않도록) -- `completed`만 세면
 * 프리셋 버튼을 완료 전에 빠르게 연타할 때 pending/processing 버전들이
 * 캡을 우회해 3개를 넘길 수 있으므로, 그 외 상태는 전부 "슬롯을 차지한
 * 것"으로 센다.
 */
export function hasReachedResultCap(versions: GenerationVersion[]): boolean {
  return versions.filter((v) => v.status !== "failed").length >= MAX_PROJECT_RESULTS;
}
