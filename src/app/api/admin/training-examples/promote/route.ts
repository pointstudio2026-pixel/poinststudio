import type { NextRequest } from "next/server";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { requireAdminTier } from "@/shared/auth/session";
import { adminContainer } from "@/modules/admin/container";

/** 관리자 수동 트리거(§6) -- 아직 평가 안 된 완료 생성물을 비용 없는 행동 신호로 평가하고, 80점 이상만 DB 참고자료로 승격한다. */
export async function POST(request: NextRequest) {
  try {
    requireAdminTier(request, ["super_admin", "manager"]);
    const result = await adminContainer.promoteGenerationsToReferenceUseCase.execute();
    return apiSuccess({ result });
  } catch (err) {
    return toApiError(err);
  }
}
