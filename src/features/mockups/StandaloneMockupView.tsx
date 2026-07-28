"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  searchMockupTemplates,
  fetchPastGenerationImages,
  createStandaloneMockup,
  type MockupTemplateDto,
  type PastGenerationImageDto,
  type StandaloneMockupDto,
} from "@/services/mockups-service";
import { AppHeader } from "@/features/navigation/AppHeader";
import { Spinner } from "@/components/Spinner";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import { MOCKUP_CATEGORY_LABEL_KEYS } from "@/features/mockups/mockupCategoryLabels";

type Step = "background" | "logo" | "result";
type LogoSourceTab = "past" | "upload";

export function StandaloneMockupView({
  email,
  name,
  planCode,
}: {
  email: string;
  name: string | null;
  planCode: PlanCode;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("background");
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<MockupTemplateDto | null>(null);
  const [logoSourceTab, setLogoSourceTab] = useState<LogoSourceTab>("past");
  const [selectedPastImage, setSelectedPastImage] = useState<PastGenerationImageDto | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [result, setResult] = useState<StandaloneMockupDto | null>(null);

  const templatesQuery = useQuery({
    queryKey: ["standalone-mockup-templates", search],
    queryFn: () => searchMockupTemplates(search),
    enabled: step === "background",
  });

  const pastImagesQuery = useQuery({
    queryKey: ["standalone-mockup-past-images"],
    queryFn: fetchPastGenerationImages,
    enabled: step === "logo" && logoSourceTab === "past",
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!selectedTemplate) throw new Error("no template selected");
      const source =
        logoSourceTab === "upload" && uploadFile
          ? ({ type: "upload", file: uploadFile } as const)
          : selectedPastImage
            ? ({ type: "past_generation", imageUrl: selectedPastImage.url } as const)
            : null;
      if (!source) throw new Error("no logo source selected");
      return createStandaloneMockup(selectedTemplate.id, source);
    },
    onSuccess: (data) => {
      setResult(data.mockup);
      setStep("result");
    },
  });

  const canExecute =
    !!selectedTemplate && ((logoSourceTab === "upload" && !!uploadFile) || (logoSourceTab === "past" && !!selectedPastImage));

  function reset() {
    setStep("background");
    setSearch("");
    setSelectedTemplate(null);
    setLogoSourceTab("past");
    setSelectedPastImage(null);
    setUploadFile(null);
    setResult(null);
    createMutation.reset();
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader user={{ email, name }} planCode={planCode} />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-8 py-10">
        <div>
          <Link href="/projects" className="text-sm text-muted underline underline-offset-4">
            {t("dashboard.myProjects")}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{t("dashboard.standaloneMockup.pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("dashboard.standaloneMockup.pageSubtitle")}</p>
        </div>

        {step === "background" && (
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-ink">{t("dashboard.standaloneMockup.step1Title")}</h2>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("dashboard.standaloneMockup.searchPlaceholder")}
              autoFocus
              className="rounded-full border border-line px-4 py-2.5 text-sm outline-none transition focus:border-ink"
            />

            {templatesQuery.isLoading && (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            )}
            {templatesQuery.isError && <p className="text-sm text-red-600">{t("dashboard.standaloneMockup.loadFailed")}</p>}
            {templatesQuery.data && templatesQuery.data.templates.length === 0 && (
              <p className="py-8 text-center text-sm text-muted">{t("dashboard.standaloneMockup.searchEmpty")}</p>
            )}
            {templatesQuery.data && templatesQuery.data.templates.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {templatesQuery.data.templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setStep("logo");
                    }}
                    className="overflow-hidden rounded-2xl border border-line bg-surface text-left transition hover:border-ink"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={template.backgroundUrl}
                      alt={t(MOCKUP_CATEGORY_LABEL_KEYS[template.category])}
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {step === "logo" && selectedTemplate && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedTemplate.backgroundUrl}
                alt={t(MOCKUP_CATEGORY_LABEL_KEYS[selectedTemplate.category])}
                className="h-16 w-16 rounded-xl object-cover"
              />
              <div className="flex-1">
                <p className="text-xs text-muted">{t("dashboard.standaloneMockup.selectedBackgroundLabel")}</p>
                <p className="text-sm font-medium">{t(MOCKUP_CATEGORY_LABEL_KEYS[selectedTemplate.category])}</p>
              </div>
              <button
                type="button"
                onClick={() => setStep("background")}
                className="whitespace-nowrap rounded-full border border-line px-3 py-1.5 text-xs transition hover:border-ink"
              >
                {t("dashboard.standaloneMockup.changeBackground")}
              </button>
            </div>

            <h2 className="text-sm font-medium text-ink">{t("dashboard.standaloneMockup.step2Title")}</h2>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLogoSourceTab("past")}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  logoSourceTab === "past" ? "bg-ink text-paper" : "border border-line text-muted hover:border-ink"
                }`}
              >
                {t("dashboard.standaloneMockup.sourceTabPast")}
              </button>
              <button
                type="button"
                onClick={() => setLogoSourceTab("upload")}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  logoSourceTab === "upload" ? "bg-ink text-paper" : "border border-line text-muted hover:border-ink"
                }`}
              >
                {t("dashboard.standaloneMockup.sourceTabUpload")}
              </button>
            </div>

            {logoSourceTab === "past" && (
              <div>
                {pastImagesQuery.isLoading && (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                )}
                {pastImagesQuery.isError && (
                  <p className="text-sm text-red-600">{t("dashboard.standaloneMockup.pastLoadFailed")}</p>
                )}
                {pastImagesQuery.data && pastImagesQuery.data.images.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted">{t("dashboard.standaloneMockup.pastEmpty")}</p>
                )}
                {pastImagesQuery.data && pastImagesQuery.data.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {pastImagesQuery.data.images.map((image) => {
                      const key = `${image.generationVersionId}-${image.imageIndex}`;
                      const isSelected =
                        selectedPastImage?.generationVersionId === image.generationVersionId &&
                        selectedPastImage?.imageIndex === image.imageIndex;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedPastImage(image)}
                          className={`overflow-hidden rounded-xl border-2 bg-surface text-left transition ${
                            isSelected ? "border-ink" : "border-transparent hover:border-line"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image.thumbnailUrl} alt={image.projectName} className="aspect-square w-full object-cover" />
                          <p className="truncate px-2 py-1.5 text-xs text-muted">{image.projectName}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {logoSourceTab === "upload" && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted">{t("dashboard.standaloneMockup.uploadHint")}</p>
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted transition hover:border-ink">
                  {uploadFile ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={URL.createObjectURL(uploadFile)} alt={uploadFile.name} className="h-24 w-24 object-contain" />
                  ) : (
                    <span>{t("dashboard.standaloneMockup.uploadCta")}</span>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  />
                  {uploadFile && <span className="text-xs">{uploadFile.name}</span>}
                </label>
              </div>
            )}

            {createMutation.isError && <p className="text-sm text-red-600">{t("dashboard.standaloneMockup.errorGeneric")}</p>}

            <button
              type="button"
              disabled={!canExecute || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending && <Spinner />}
              {createMutation.isPending ? t("dashboard.standaloneMockup.generating") : t("dashboard.standaloneMockup.executeButton")}
            </button>
          </section>
        )}

        {step === "result" && result && (
          <section className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-lg font-semibold">{t("dashboard.standaloneMockup.resultTitle")}</h2>
            {result.resultImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.resultImageUrl}
                alt={selectedTemplate ? t(MOCKUP_CATEGORY_LABEL_KEYS[selectedTemplate.category]) : ""}
                className="w-full max-w-md rounded-2xl border border-line object-contain shadow-soft"
              />
            )}
            <div className="flex gap-2">
              {result.resultImageUrl && (
                <a
                  href={result.resultImageUrl}
                  download
                  className="rounded-full border border-line px-5 py-2.5 text-sm transition hover:border-ink"
                >
                  {t("dashboard.standaloneMockup.download")}
                </a>
              )}
              <button
                type="button"
                onClick={reset}
                className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition hover:opacity-90"
              >
                {t("dashboard.standaloneMockup.makeAnother")}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
