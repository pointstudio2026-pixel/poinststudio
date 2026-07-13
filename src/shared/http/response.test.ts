import { describe, expect, it } from "vitest";
import { apiSuccess, apiError, toApiError } from "@/shared/http/response";
import { NotFoundError, InternalError } from "@/shared/errors/AppError";

describe("apiSuccess", () => {
  it("wraps data in the standard success envelope", async () => {
    const res = apiSuccess({ hello: "world" });
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual({ hello: "world" });
    expect(body.error).toBeNull();
    expect(body.meta.requestId).toBeTruthy();
    expect(body.meta.timestamp).toBeTruthy();
  });
});

describe("apiError", () => {
  it("wraps an AppError in the standard error envelope with its httpStatus", async () => {
    const err = new NotFoundError("Project not found");
    const res = apiError(err);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.data).toBeNull();
    expect(body.error).toEqual({
      code: "NOT_FOUND",
      message: "Project not found",
      details: undefined,
    });
  });
});

describe("toApiError", () => {
  it("passes AppError instances through unchanged", async () => {
    const res = toApiError(new NotFoundError("missing"));
    expect(res.status).toBe(404);
  });

  it("wraps unknown errors as InternalError (500) without leaking internals", async () => {
    const res = toApiError(new Error("some internal detail"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe(new InternalError().code);
  });
});
