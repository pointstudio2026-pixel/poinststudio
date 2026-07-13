// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("fetch", vi.fn());
  Object.defineProperty(window, "location", {
    value: { href: "", pathname: "/dashboard" },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch (Task-003/004 silent refresh)", () => {
  it("passes a successful response straight through", async () => {
    const { apiFetch } = await import("@/services/http-client");
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse({ success: true, data: { ok: true }, error: null }, 200),
    );

    const data = await apiFetch<{ ok: boolean }>("/api/whatever");
    expect(data.ok).toBe(true);
  });

  it("silently refreshes once on a 401 and retries the original request", async () => {
    const { apiFetch } = await import("@/services/http-client");
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          { success: false, data: null, error: { code: "AUTH-006", message: "expired" } },
          401,
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { ok: true }, error: null }, 200));

    const data = await apiFetch<{ ok: boolean }>("/api/protected");

    expect(data.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/auth/refresh");
    expect(window.location.href).toBe(""); // no redirect on the happy path
  });

  it("redirects to /login when the silent refresh also fails", async () => {
    const { apiFetch } = await import("@/services/http-client");
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          { success: false, data: null, error: { code: "AUTH-008", message: "reused" } },
          401,
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(apiFetch("/api/protected")).rejects.toThrow();
    expect(window.location.href).toBe("/login");
  });

  it("de-duplicates concurrent 401s into a single POST /api/auth/refresh call", async () => {
    const { apiFetch } = await import("@/services/http-client");
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const callsPerUrl = new Map<string, number>();

    fetchMock.mockImplementation((url: string) => {
      const n = (callsPerUrl.get(url) ?? 0) + 1;
      callsPerUrl.set(url, n);

      if (url === "/api/auth/refresh") {
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      if (n === 1) {
        return Promise.resolve(
          jsonResponse(
            { success: false, data: null, error: { code: "AUTH-006", message: "expired" } },
            401,
          ),
        );
      }
      return Promise.resolve(jsonResponse({ success: true, data: { url }, error: null }, 200));
    });

    const [a, b] = await Promise.all([
      apiFetch<{ url: string }>("/api/protected/a"),
      apiFetch<{ url: string }>("/api/protected/b"),
    ]);

    expect(a.url).toBe("/api/protected/a");
    expect(b.url).toBe("/api/protected/b");
    expect(callsPerUrl.get("/api/auth/refresh")).toBe(1);
  });
});
