"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMyWork, type MyWorkItemDto } from "@/services/my-work-service";
import { AppHeader } from "@/features/navigation/AppHeader";
import { Spinner } from "@/components/Spinner";
import { ImageLightbox } from "@/components/ImageLightbox";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

export function MyWorkView({
  email,
  name,
  planCode,
}: {
  email: string;
  name: string | null;
  planCode: PlanCode;
}) {
  const { t } = useTranslation();
  const [lightboxItem, setLightboxItem] = useState<MyWorkItemDto | null>(null);

  const myWorkQuery = useQuery({ queryKey: ["my-work"], queryFn: fetchMyWork });
  const items = myWorkQuery.data?.items ?? [];

  function labelFor(item: MyWorkItemDto): string {
    return item.sourceType === "standalone_mockup" ? t("dashboard.myWork.sourceStandaloneMockup") : item.projectName;
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader user={{ email, name }} planCode={planCode} />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-8 py-10">
        <div>
          <h1 className="text-2xl font-semibold">{t("dashboard.myWork.pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("dashboard.myWork.pageSubtitle")}</p>
        </div>

        {myWorkQuery.isLoading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {myWorkQuery.isError && <p className="text-sm text-red-600">{t("dashboard.myWork.loadFailed")}</p>}

        {myWorkQuery.data && items.length === 0 && (
          <p className="py-16 text-center text-sm text-muted">{t("dashboard.myWork.empty")}</p>
        )}

        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-line bg-surface"
              >
                <button
                  type="button"
                  onClick={() => setLightboxItem(item)}
                  className="block w-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnailUrl}
                    alt={labelFor(item)}
                    className="aspect-square w-full object-contain"
                  />
                </button>
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <p className="truncate text-xs text-muted">{labelFor(item)}</p>
                  <a
                    href={item.imageUrl}
                    download
                    className="whitespace-nowrap rounded-full border border-line px-2.5 py-1 text-xs transition hover:border-ink"
                  >
                    {t("dashboard.myWork.download")}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {lightboxItem && (
        <ImageLightbox src={lightboxItem.imageUrl} alt={labelFor(lightboxItem)} onClose={() => setLightboxItem(null)} />
      )}
    </div>
  );
}
