import { describe, expect, it, vi } from "vitest";
import { GetDesignMemoryUseCase } from "@/modules/designMemory/application/GetDesignMemoryUseCase";
import { UpdateDesignMemoryUseCase } from "@/modules/designMemory/application/UpdateDesignMemoryUseCase";
import { ResetDesignMemoryUseCase } from "@/modules/designMemory/application/ResetDesignMemoryUseCase";
import { UpdateDesignMemorySettingsUseCase } from "@/modules/designMemory/application/UpdateDesignMemorySettingsUseCase";
import {
  FakeDesignMemorySettingsRepository,
  FakeDesignMemorySignalsRepository,
} from "@/modules/designMemory/testing/fakes";
import { FakeStyleRepository, FakeStyleFavoriteRepository } from "@/modules/styles/testing/fakes";
import type { Style } from "@/modules/styles/domain/Style";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

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

function setup() {
  const settings = new FakeDesignMemorySettingsRepository();
  const signals = new FakeDesignMemorySignalsRepository();
  const styles = new FakeStyleRepository();
  const favorites = new FakeStyleFavoriteRepository();
  styles.styles = [STYLE];

  return {
    settings,
    signals,
    styles,
    favorites,
    get: new GetDesignMemoryUseCase(settings, signals, styles, favorites),
    update: new UpdateDesignMemoryUseCase(settings),
    reset: new ResetDesignMemoryUseCase(settings),
    updateSettings: new UpdateDesignMemorySettingsUseCase(settings),
  };
}

describe("GetDesignMemoryUseCase", () => {
  it("lazily provisions default settings for a brand-new user (신규 사용자)", async () => {
    const ctx = setup();
    const profile = await ctx.get.execute({ userId: "user-1" });

    expect(profile.enabled).toBe(true);
    expect(profile.signalCount).toBe(0);
    expect(ctx.settings.settings.get("user-1")).toBeTruthy();
  });

  it("returns an empty profile when disabled (비활성화)", async () => {
    const ctx = setup();
    await ctx.settings.createDefault("user-1");
    await ctx.settings.setEnabled("user-1", false);
    ctx.signals.styleCounts = [{ styleId: STYLE.id, count: 3 }];

    const profile = await ctx.get.execute({ userId: "user-1" });
    expect(profile.enabled).toBe(false);
    expect(profile.topStyles).toEqual([]);
  });

  it("resolves top style ids into full Style objects (추천 결과 확인)", async () => {
    const ctx = setup();
    ctx.signals.styleCounts = [{ styleId: STYLE.id, count: 4 }];

    const profile = await ctx.get.execute({ userId: "user-1" });
    expect(profile.topStyles[0]?.style.name).toBe("Monochrome Bold");
  });

  it("includes favorite styles from the Style Engine's favorites (즐겨찾기 반영)", async () => {
    const ctx = setup();
    await ctx.favorites.add("user-1", STYLE.id);

    const profile = await ctx.get.execute({ userId: "user-1" });
    expect(profile.favoriteStyles.map((s) => s.id)).toContain(STYLE.id);
  });
});

describe("ResetDesignMemoryUseCase", () => {
  it("sets resetAt without deleting the underlying signal data (메모리 초기화)", async () => {
    const ctx = setup();
    await ctx.settings.createDefault("user-1");
    ctx.signals.styleCounts = [{ styleId: STYLE.id, count: 5 }];

    const before = await ctx.get.execute({ userId: "user-1" });
    expect(before.topStyles).toHaveLength(1);

    const resetSettings = await ctx.reset.execute({ userId: "user-1" });
    expect(resetSettings.resetAt).not.toBeNull();

    // The fake signals repo doesn't filter by "since" itself (that's the
    // real Prisma repo's job), so this confirms reset only touches
    // settings -- it never mutates/clears the signal source data.
    const after = await ctx.get.execute({ userId: "user-1" });
    expect(after.resetAt).not.toBeNull();
    expect(ctx.signals.styleCounts).toHaveLength(1);
  });
});

describe("UpdateDesignMemorySettingsUseCase", () => {
  it("toggles enabled and persists it (프로젝트 완료 후 업데이트)", async () => {
    const ctx = setup();
    const disabled = await ctx.updateSettings.execute({ userId: "user-1", enabled: false });
    expect(disabled.enabled).toBe(false);

    const enabled = await ctx.updateSettings.execute({ userId: "user-1", enabled: true });
    expect(enabled.enabled).toBe(true);
  });
});

describe("UpdateDesignMemoryUseCase", () => {
  it("provisions settings on first call without erroring", async () => {
    const ctx = setup();
    const settings = await ctx.update.execute({ userId: "user-1", projectId: "project-1" });
    expect(settings.userId).toBe("user-1");
  });
});
