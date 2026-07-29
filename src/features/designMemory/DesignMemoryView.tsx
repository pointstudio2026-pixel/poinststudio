"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDesignMemory, resetDesignMemory, updateDesignMemorySettings } from "@/services/design-memory-service";
import { MOCKUP_CATEGORY_LABEL_KEYS } from "@/features/mockups/mockupCategoryLabels";
import { EDIT_PRESET_LABEL_KEYS } from "@/features/generation/editPresetLabels";
import { Spinner } from "@/components/Spinner";
import { AppHeader } from "@/features/navigation/AppHeader";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

export function DesignMemoryView({
  email,
  name,
  planCode,
}: {
  email: string;
  name: string | null;
  planCode: PlanCode;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["design-memory"],
    queryFn: fetchDesignMemory,
  });

  async function handleToggle(enabled: boolean) {
    setActionError(null);
    try {
      await updateDesignMemorySettings(enabled);
      await queryClient.invalidateQueries({ queryKey: ["design-memory"] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("designMemory.toggleFailed"));
    }
  }

  async function handleReset() {
    const confirmed = window.confirm(t("designMemory.resetConfirm"));
    if (!confirmed) return;
    setIsResetting(true);
    setActionError(null);
    try {
      await resetDesignMemory();
      await queryClient.invalidateQueries({ queryKey: ["design-memory"] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("designMemory.resetFailed"));
    } finally {
      setIsResetting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper">
        <AppHeader user={{ email, name }} planCode={planCode} />
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      </div>
    );
  }

  const profile = data?.profile;

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader user={{ email, name }} planCode={planCode} />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 p-5 sm:p-8">
      <h1 className="text-xl font-semibold">Design Memory</h1>

      <p className="text-sm text-muted">{t("designMemory.description")}</p>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <h2 className="text-sm font-medium text-ink">{t("designMemory.settingsTitle")}</h2>
        <div className="mt-2 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={profile?.enabled ?? true}
              onChange={(e) => handleToggle(e.target.checked)}
            />
            {t("designMemory.enableToggle")}
          </label>
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {isResetting && <Spinner />}
            {t("designMemory.resetButton")}
          </button>
        </div>
        {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
      </section>

      {!profile?.enabled && (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
          {t("designMemory.disabledNotice")}
        </div>
      )}

      {profile?.enabled && profile.signalCount === 0 && (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
          {t("designMemory.emptyState")}
        </div>
      )}

      {profile?.enabled && profile.signalCount > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-ink">{t("designMemory.reasonsTitle")}</h2>

          {profile.topStyles.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
              <p className="text-xs font-medium text-muted">{t("designMemory.topStylesLabel")}</p>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {profile.topStyles.map((s) => (
                  <li key={s.style.id}>
                    {s.style.name}{" "}
                    <span className="text-xs text-muted">
                      — {t("designMemory.styleReason", { count: s.count })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {profile.topEditPresets.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
              <p className="text-xs font-medium text-muted">{t("designMemory.topEditPresetsLabel")}</p>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {profile.topEditPresets.map((p) => {
                  const presetLabelKey = EDIT_PRESET_LABEL_KEYS[p.presetKey];
                  const presetLabel = presetLabelKey ? t(presetLabelKey) : p.label;
                  return (
                    <li key={p.presetKey}>
                      {presetLabel}{" "}
                      <span className="text-xs text-muted">
                        — {t("designMemory.editPresetReason", { label: presetLabel, count: p.count })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {profile.favoriteStyles.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
              <p className="text-xs font-medium text-muted">{t("designMemory.favoriteStylesLabel")}</p>
              <p className="mt-2 text-sm">{profile.favoriteStyles.map((s) => s.name).join(", ")}</p>
            </div>
          )}

          {profile.favoriteMockupCategories.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
              <p className="text-xs font-medium text-muted">{t("designMemory.favoriteMockupCategoriesLabel")}</p>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {profile.favoriteMockupCategories.map((c) => (
                  <li key={c.category}>
                    {t(MOCKUP_CATEGORY_LABEL_KEYS[c.category])}{" "}
                    <span className="text-xs text-muted">
                      — {t("designMemory.mockupReason", { count: c.count })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(profile.preferredColors.length > 0 || profile.preferredTypography.length > 0) && (
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
              <p className="text-xs font-medium text-muted">{t("designMemory.preferredDirectionLabel")}</p>
              {profile.preferredColors.length > 0 && (
                <p className="mt-1 text-sm">
                  {t("designMemory.colorLabel")}
                  {profile.preferredColors.map((c) => c.value).join(", ")}
                </p>
              )}
              {profile.preferredTypography.length > 0 && (
                <p className="mt-1 text-sm">
                  {t("designMemory.typographyLabel")}
                  {profile.preferredTypography.map((tp) => tp.value).join(", ")}
                </p>
              )}
            </div>
          )}

          {profile.topIndustries.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
              <p className="text-xs font-medium text-muted">{t("designMemory.topIndustriesLabel")}</p>
              <p className="mt-1 text-sm">{profile.topIndustries.map((i) => i.value).join(", ")}</p>
            </div>
          )}
        </section>
      )}
      </main>
    </div>
  );
}
