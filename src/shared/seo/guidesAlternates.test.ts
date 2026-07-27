import { describe, expect, it } from "vitest";
import { buildGuidesAlternates } from "@/shared/seo/guidesAlternates";

describe("buildGuidesAlternates", () => {
  it("gives ko no prefix and other locales a /{locale} prefix, for an article slug", () => {
    const result = buildGuidesAlternates("/handcrafted-warm");
    expect(result.ko).toBe("https://www.designaster.com/guides/handcrafted-warm");
    expect(result.en).toBe("https://www.designaster.com/en/guides/handcrafted-warm");
    expect(result.ja).toBe("https://www.designaster.com/ja/guides/handcrafted-warm");
    expect(result["x-default"]).toBe("https://www.designaster.com/guides/handcrafted-warm");
  });

  it("handles an empty suffix for the hub root", () => {
    const result = buildGuidesAlternates("");
    expect(result.ko).toBe("https://www.designaster.com/guides");
    expect(result.fr).toBe("https://www.designaster.com/fr/guides");
  });

  it("handles a category query string suffix", () => {
    const result = buildGuidesAlternates("?category=faq");
    expect(result.ko).toBe("https://www.designaster.com/guides?category=faq");
    expect(result.de).toBe("https://www.designaster.com/de/guides?category=faq");
  });
});
