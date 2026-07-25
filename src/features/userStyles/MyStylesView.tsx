"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addUserStyleReferenceImage,
  createUserStyleCategory,
  deleteUserStyleCategory,
  fetchUserStyleCategories,
  reanalyzeUserStyleCategory,
  userStyleReferenceImageUrl,
  type UserStyleCategoryDto,
} from "@/services/user-styles-service";
import { MAX_REFERENCES_PER_CATEGORY } from "@/modules/userStyles/domain/userStyleRules";
import { Spinner } from "@/components/Spinner";
import { AppHeader } from "@/features/navigation/AppHeader";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

export function MyStylesView({
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
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyCategoryId, setBusyCategoryId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["user-style-categories"],
    queryFn: fetchUserStyleCategories,
  });

  const categories = data?.categories ?? [];

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["user-style-categories"] });
  }

  async function handleCreate() {
    const name = newCategoryName.trim();
    if (!name) return;
    setIsCreating(true);
    setError(null);
    try {
      await createUserStyleCategory(name);
      setNewCategoryName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("myStyles.createCategoryFailed"));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpload(category: UserStyleCategoryDto, file: File) {
    setBusyCategoryId(category.id);
    setError(null);
    try {
      await addUserStyleReferenceImage(category.id, file);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("myStyles.uploadFailed"));
    } finally {
      setBusyCategoryId(null);
    }
  }

  async function handleReanalyze(categoryId: string) {
    setBusyCategoryId(categoryId);
    setError(null);
    try {
      await reanalyzeUserStyleCategory(categoryId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("myStyles.reanalyzeFailed"));
    } finally {
      setBusyCategoryId(null);
    }
  }

  async function handleDelete(categoryId: string) {
    const confirmed = window.confirm(t("myStyles.deleteConfirm"));
    if (!confirmed) return;
    setBusyCategoryId(categoryId);
    setError(null);
    try {
      await deleteUserStyleCategory(categoryId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("myStyles.deleteFailed"));
    } finally {
      setBusyCategoryId(null);
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

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader user={{ email, name }} planCode={planCode} />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <header>
        <h1 className="text-xl font-semibold">{t("myStyles.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("myStyles.description")}</p>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
        <h2 className="text-sm font-medium text-ink">{t("myStyles.newCategory.title")}</h2>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={t("myStyles.newCategory.placeholder")}
            className="flex-1 rounded-full border border-line px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || !newCategoryName.trim()}
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50"
          >
            {isCreating && <Spinner />}
            {t("myStyles.newCategory.submit")}
          </button>
        </div>
      </section>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
          {t("myStyles.empty")}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {categories.map((category) => {
            const isBusy = busyCategoryId === category.id;
            return (
              <div key={category.id} className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">{category.name}</h3>
                    <p className="mt-1 text-xs text-muted">
                      {category.description ?? t("myStyles.noAnalysisYet")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(category.id)}
                    disabled={isBusy}
                    className="shrink-0 text-xs text-red-600 underline disabled:opacity-50"
                  >
                    {t("myStyles.delete")}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {category.references.map((ref) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={ref.id}
                      src={userStyleReferenceImageUrl(ref.id)}
                      alt=""
                      className="h-20 w-20 rounded-xl border border-line object-cover"
                    />
                  ))}
                  {category.references.length < MAX_REFERENCES_PER_CATEGORY && (
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[category.id]?.click()}
                      disabled={isBusy}
                      className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-line text-xs text-muted disabled:opacity-50"
                    >
                      {isBusy ? <Spinner /> : t("myStyles.addImage")}
                    </button>
                  )}
                  <input
                    ref={(el) => {
                      fileInputRefs.current[category.id] = el;
                    }}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleUpload(category, file);
                      e.target.value = "";
                    }}
                  />
                </div>

                {category.references.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleReanalyze(category.id)}
                    disabled={isBusy}
                    className="mt-3 text-xs text-muted underline disabled:opacity-50"
                  >
                    {t("myStyles.reanalyze")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      </main>
    </div>
  );
}
