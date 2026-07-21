import Link from "next/link";
import { getNextStep } from "@/features/workspace/stepRoutes";

export function NextStepButton({
  projectId,
  currentStepKey,
  deliverableType,
}: {
  projectId: string;
  currentStepKey: string;
  /**
   * "style" 이후 다음 단계가 유형에 따라 갈리므로(브랜딩 & 로고 -> 브랜드
   * 전략, 그 외 -> 이미지 생성) 그 지점에서만 실제 값을 넘겨야 한다. 다른
   * 모든 전환은 두 목록에서 동일한 다음 단계를 가지므로 생략해도 안전하다.
   */
  deliverableType?: string | null;
}) {
  const next = getNextStep(currentStepKey, deliverableType);
  if (!next) return null;

  return (
    <Link
      href={`/projects/${projectId}/${next.route}`}
      className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white transition hover:opacity-90"
    >
      다음 단계: {next.label}
      <span aria-hidden>→</span>
    </Link>
  );
}
