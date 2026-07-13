import { NextResponse } from "next/server";
import { AppError, InternalError } from "@/shared/errors/AppError";

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
  if (err instanceof AppError) {
    return apiError(err, { requestId });
  }
  const wrapped = new InternalError(
    err instanceof Error ? err.message : "Unexpected error",
  );
  return apiError(wrapped, { requestId });
}
