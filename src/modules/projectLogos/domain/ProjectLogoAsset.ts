export interface ProjectLogoAsset {
  id: string;
  projectId: string;
  storageKey: string;
  contentType: string;
  originalFileName: string | null;
  /** "첨부하기"로 확정되기 전까지는 false -- 생성 파이프라인은 이 값이
   * true인 자산만 참조해야 한다(그렇지 않으면 드롭존에 파일만 올려두고
   * 이동한 경우에도 로고 합성 경로를 잘못 타게 된다). */
  confirmed: boolean;
  createdAt: Date;
}
