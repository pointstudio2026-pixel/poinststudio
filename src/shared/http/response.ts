import { NextResponse } from "next/server";
import { AppError, InternalError } from "@/shared/errors/AppError";
import { sendN8nAlert } from "@/shared/monitoring/n8nAlert";

export interface ApiMeta {
  requestId: string;
  timestamp: string;
}

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  error: null;
  meta: ApiMeta;
}

export interface ApiErrorBody {
  success: false;
  data: null;
  error: { code: string; message: string; details?: unknown };
  meta: ApiMeta;
}

function meta(requestId: string): ApiMeta {
  return { requestId, timestamp: new Date().toISOString() };
}

export function apiSuccess<T>(
  data: T,
  options?: { requestId?: string; status?: number },
): NextResponse<ApiSuccessBody<T>> {
  const requestId = options?.requestId ?? crypto.randomUUID();
  return NextResponse.json(
    { success: true, data, error: null, meta: meta(requestId) },
    { status: options?.status ?? 200 },
  );
}

export function apiError(
  error: AppError,
  options?: { requestId?: string },
): NextResponse<ApiErrorBody> {
  const requestId = options?.requestId ?? crypto.randomUUID();
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: { code: error.code, message: error.message, details: error.details },
      meta: meta(requestId),
    },
    { status: error.httpStatus },
  );
}

export function toApiError(err: unknown, requestId?: string): NextResponse<ApiErrorBody> {
  const resolved =
    err instanceof AppError
      ? err
      : new InternalError(err instanceof Error ? err.message : "Unexpected error");

  // 500번대(예상 못한 버그, AI 프로바이더 장애 등)만 실시간 알림 -- 400번대
  // 검증/권한/충돌 에러는 정상적인 사용자 흐름이라 알림 대상이 아니다.
  if (resolved.httpStatus >= 500) {
    sendN8nAlert(process.env.N8N_ERROR_WEBHOOK_URL, {
      code: resolved.code,
      message: resolved.message,
      httpStatus: resolved.httpStatus,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  return apiError(resolved, { requestId });
}
