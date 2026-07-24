import { describe, expect, it } from "vitest";
import { composeDesignMemoryProfile } from "@/modules/designMemory/domain/designMemoryComposer";
import type { Style } from "@/modules/styles/domain/Style";

const STYLE: Style = {
  id: "style-1",
  name: "Monochrome Bold",
  slug: "minimal-monochrome-bold",
  level: 3,
  parentId: "parent-1",
  category: "Minimal",
  keywords: [],
  description: "설명",
  sampleImageUrl: null,
};

describe("composeDesignMemoryProfile", () => {
  it("returns an empty profile when disabled (신규 사용자 / 비활성화)", () => {
    const profile = composeDesignMemoryProfile({
      enabled: false,
      resetAt: null,
      styleCounts: [{ styleId: "style-1", count: 5 }],
      stylesById: new Map([["style-1", STYLE]]),
      editPresetCounts: [],
      favoriteStyles: [],
      strategySignals: [],
      mockupCategoryCounts: [],
    });

    expect(profile.enabled).toBe(false);
    expect(profile.topStyles).toEqual([]);
    expect(profile.signalCount).toBe(0);
  });

  it("returns an empty profile for a brand-new user with no signals yet", () => {
    const profile = composeDesignMemoryProfile({
      enabled: true,
      resetAt: null,
      styleCounts: [],
      stylesById: new Map(),
      editPresetCounts: [],
      favoriteStyles: [],
      strategySignals: [],
      mockupCategoryCounts: [],
    });

    expect(profile.signalCount).toBe(0);
    expect(profile.topStyles).toEqual([]);
  });

  it("builds top styles with a reason from counts, skipping unresolved style ids", () => {
    const profile = composeDesignMemoryProfile({
      enabled: true,
      resetAt: null,
      styleCounts: [
        { styleId: "style-1", count: 3 },
        { styleId: "missing-style", count: 1 },
      ],
      stylesById: new Map([["style-1", STYLE]]),
      editPresetCounts: [],
      favoriteStyles: [],
      strategySignals: [],
      mockupCategoryCounts: [],
    });

    expect(profile.topStyles).toHaveLength(1);
    expect(profile.topStyles[0]?.style.id).toBe("style-1");
    expect(profile.topStyles[0]?.reason).toContain("3번");
  });

  it("resolves edit preset counts to labels, ignoring unknown keys", () => {
    const profile = composeDesignMemoryProfile({
      enabled: true,
      resetAt: null,
      styleCounts: [],
      stylesById: new Map(),
      editPresetCounts: [
        { presetKey: "more_minimal", count: 4 },
        { presetKey: "not-a-real-preset", count: 2 },
      ],
      favoriteStyles: [],
      strategySignals: [],
      mockupCategoryCounts: [],
    });

    expect(profile.topEditPresets).toHaveLength(1);
    expect(profile.topEditPresets[0]?.label).toBe("더 미니멀하게");
  });

  it("aggregates preferred colors/typography/industries from brand strategy signals", () => {
    const profile = composeDesignMemoryProfile({
      enabled: true,
      resetAt: null,
      styleCounts: [],
      stylesById: new Map(),
      editPresetCounts: [],
      favoriteStyles: [],
      strategySignals: [
        { industry: "bakery", preferredColor: "웜톤", typographyDirection: "산세리프" },
        { industry: "bakery", preferredColor: "웜톤", typographyDirection: "세리프" },
        { industry: "cafe", preferredColor: "쿨톤", typographyDirection: "산세리프" },
      ],
      mockupCategoryCounts: [],
    });

    expect(profile.topIndustries[0]).toEqual({ value: "bakery", count: 2 });
    expect(profile.preferredColors[0]).toEqual({ value: "웜톤", count: 2 });
    expect(profile.signalCount).toBe(3);
  });

  it("ranks favorite mockup categories and ignores unknown category strings", () => {
    const profile = composeDesignMemoryProfile({
      enabled: true,
      resetAt: null,
      styleCounts: [],
      stylesById: new Map(),
      editPresetCounts: [],
      favoriteStyles: [],
      strategySignals: [],
      mockupCategoryCounts: [
        { category: "signboard", count: 3 },
        { category: "not-a-category", count: 9 },
      ],
    });

    expect(profile.favoriteMockupCategories).toHaveLength(1);
    expect(profile.favoriteMockupCategories[0]?.category).toBe("signboard");
  });
});
