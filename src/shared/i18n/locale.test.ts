import { describe, expect, it } from "vitest";
import { detectLocaleFromAcceptLanguage } from "@/shared/i18n/locale";

describe("detectLocaleFromAcceptLanguage", () => {
  it("returns null for null/undefined/empty header", () => {
    expect(detectLocaleFromAcceptLanguage(null)).toBeNull();
    expect(detectLocaleFromAcceptLanguage(undefined)).toBeNull();
    expect(detectLocaleFromAcceptLanguage("")).toBeNull();
  });

  it("picks the primary subtag of the highest-priority supported tag", () => {
    expect(detectLocaleFromAcceptLanguage("en-US,en;q=0.9,ko;q=0.8")).toBe("en");
  });

  it("matches a bare language tag", () => {
    expect(detectLocaleFromAcceptLanguage("ja")).toBe("ja");
  });

  it("respects explicit q-values over list order", () => {
    // fr-CA (q=0.9) should win over en (q=0.8) despite appearing second
    expect(detectLocaleFromAcceptLanguage("en;q=0.8,fr-CA;q=0.9")).toBe("fr");
  });

  it("falls through unsupported tags to find a supported one", () => {
    expect(detectLocaleFromAcceptLanguage("zh-CN,zh;q=0.9,de;q=0.8")).toBe("de");
  });

  it("returns null when nothing in the header is supported", () => {
    expect(detectLocaleFromAcceptLanguage("zh-CN,zh;q=0.9,ru;q=0.8")).toBeNull();
  });

  it("handles malformed entries without throwing", () => {
    expect(detectLocaleFromAcceptLanguage(",,;q=,en")).toBe("en");
  });
});
