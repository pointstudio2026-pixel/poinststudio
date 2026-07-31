"use client";

import { useEffect, useState } from "react";
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
import { ImageLightbox } from "@/components/ImageLightbox";
import { OAuthButtons } from "@/features/auth/OAuthButtons";
import { ApiError } from "@/services/http-client";
import { useTranslation } from "@/shared/i18n/LocaleProvider";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import type { PrimaryNavUser } from "@/features/navigation/PrimaryNav";
import { MOCKUP_CATEGORY_LABEL_KEYS } from "@/features/mockups/mockupCategoryLabels";
import { mockupTemplateTitleKey } from "@/features/mockups/mockupTemplateTitleLabels";

type Step = "category" | "background" | "logo" | "result";
type LogoSourceTab = "past" | "upload";
type MockupCategoryOption = "logo" | "poster" | "package" | "businessCard";

const COMING_SOON_CATEGORIES: MockupCategoryOption[] = ["poster", "package", "businessCard"];

export function StandaloneMockupView({
  user,
  planCode,
}: {
  user: PrimaryNavUser | null;
  planCode: PlanCode | null;
}) {
  const { t, locale } = useTranslation();
  const [step, setStep] = useState<Step>("category");
  const [comingSoonCategory, setComingSoonCategory] = useState<MockupCategoryOption | null>(null);
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<MockupTemplateDto | null>(null);
  const [logoSourceTab, setLogoSourceTab] = useState<LogoSourceTab>(user ? "past" : "upload");
  const [selectedPastImage, setSelectedPastImage] = useState<PastGenerationImageDto | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [result, setResult] = useState<StandaloneMockupDto | null>(null);
  const [previewBackgroundUrl, setPreviewBackgroundUrl] = useState<string | null>(null);
  const [previewResultUrl, setPreviewResultUrl] = useState<string | null>(null);

  // 배경 선택/로고 첨부/결과는 실제 URL 이동 없이 같은 페이지 안에서 단계만
  // 바뀌는 구조라, 브라우저 뒤로가기를 누르면 이 단계들을 건너뛰고 곧장
  // 이 페이지 진입 전의 실제 이전 페이지(보통 내 프로젝트)로 나가버렸다.
  // 단계가 앞으로 넘어갈 때마다 history entry를 하나씩 쌓아서, 뒤로가기가
  // "목업 만들기" 안의 이전 단계(배경 선택 화면)로 먼저 돌아오게 한다.
  useEffect(() => {
    window.history.replaceState({ step: "category" }, "", window.location.href);
    function onPopState(e: PopStateEvent) {
      const state = e.state as { step?: Step } | null;
      setStep(state?.step ?? "category");
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function pushStep(nextStep: Step) {
    window.history.pushState({ step: nextStep }, "", window.location.href);
    setStep(nextStep);
  }

  const templatesQuery = useQuery({
    queryKey: ["standalone-mockup-templates", search, locale],
    queryFn: () => searchMockupTemplates(search, locale),
    enabled: step === "background",
  });

  const pastImagesQuery = useQuery({
    queryKey: ["standalone-mockup-past-images"],
    queryFn: fetchPastGenerationImages,
    enabled: !!user && step === "logo" && logoSourceTab === "past",
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
      pushStep("result");
    },
  });

  const canExecute =
    !!selectedTemplate && ((logoSourceTab === "upload" && !!uploadFile) || (logoSourceTab === "past" && !!selectedPastImage));

  function reset() {
    pushStep("background");
    setSearch("");
    setSelectedTemplate(null);
    setLogoSourceTab(user ? "past" : "upload");
    setSelectedPastImage(null);
    setUploadFile(null);
    setResult(null);
    createMutation.reset();
  }

  const guestLimitError =
    createMutation.error instanceof ApiError && createMutation.error.code === "GUEST_MOCKUP_LIMIT_REACHED"
      ? createMutation.error
      : null;

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader user={user} planCode={planCode} />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
        <div className="mx-auto w-full max-w-3xl">
          <button
            type="button"
            onClick={() => setStep("category")}
            className="text-sm text-muted underline underline-offset-4"
          >
            {t("nav.mockup")}
          </button>
          <h1 className="mt-2 text-2xl font-semibold">
            {step === "category" ? t("dashboard.standaloneMockup.pageTitle") : t("dashboard.standaloneMockup.logoMockupTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {step === "category" ? t("dashboard.standaloneMockup.pageSubtitle") : t("dashboard.standaloneMockup.logoMockupSubtitle")}
          </p>
        </div>

        {step === "category" && (
          <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => {
                  setComingSoonCategory(null);
                  pushStep("background");
                }}
                className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-6 text-center transition hover:border-ink"
              >
                <span className="text-sm font-medium text-ink">{t("dashboard.standaloneMockup.category.logo")}</span>
              </button>
              {COMING_SOON_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setComingSoonCategory(category)}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-6 text-center text-muted transition hover:border-ink"
                >
                  <span className="text-sm font-medium">{t(`dashboard.standaloneMockup.category.${category}`)}</span>
                </button>
              ))}
            </div>
            {comingSoonCategory && (
              <p className="text-center text-sm text-muted">{t("dashboard.standaloneMockup.comingSoon")}</p>
            )}
          </section>
        )}

        {step === "background" && (
          <section className="flex flex-col gap-4">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
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
              {templatesQuery.isError && (
                <p className="text-sm text-red-600">{t("dashboard.standaloneMockup.loadFailed")}</p>
              )}
              {templatesQuery.data && templatesQuery.data.templates.length === 0 && (
                <p className="py-8 text-center text-sm text-muted">{t("dashboard.standaloneMockup.searchEmpty")}</p>
              )}
            </div>

            {templatesQuery.data && templatesQuery.data.templates.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {templatesQuery.data.templates.map((template) => {
                  const titleKey = mockupTemplateTitleKey(template.slug, MOCKUP_CATEGORY_LABEL_KEYS[template.category]);
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(template);
                        pushStep("logo");
                      }}
                      className="overflow-hidden rounded-2xl border border-line bg-surface text-left transition hover:border-ink"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={template.backgroundUrl} alt={t(titleKey)} className="aspect-square w-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {step === "logo" && selectedTemplate && (
          <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
              <button
                type="button"
                onClick={() => setPreviewBackgroundUrl(selectedTemplate.backgroundUrl)}
                className="flex-shrink-0 overflow-hidden rounded-xl transition hover:opacity-80"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedTemplate.backgroundUrl}
                  alt={t(mockupTemplateTitleKey(selectedTemplate.slug, MOCKUP_CATEGORY_LABEL_KEYS[selectedTemplate.category]))}
                  className="h-16 w-16 object-cover"
                />
              </button>
              <div className="flex-1">
                <p className="text-xs text-muted">{t("dashboard.standaloneMockup.selectedBackgroundLabel")}</p>
                <p className="text-sm font-medium">
                  {t(mockupTemplateTitleKey(selectedTemplate.slug, MOCKUP_CATEGORY_LABEL_KEYS[selectedTemplate.category]))}
                </p>
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

            {/* 게스트는 계정 이력이 없어 "과거 이미지" 탭 자체를 숨긴다(비어있는
                화면을 보여주는 대신 처음부터 업로드만 가능하게). */}
            {user && (
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
            )}

            {user && logoSourceTab === "past" && (
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

            {guestLimitError ? (
              <div className="rounded-2xl border border-line bg-surface p-5 text-center">
                <p className="text-sm font-medium">{t("dashboard.standaloneMockup.guest.limitReachedTitle")}</p>
                <p className="mt-1 text-xs text-muted">{t("dashboard.standaloneMockup.guest.limitReachedMessage")}</p>
                <div className="mt-4">
                  <OAuthButtons intent="register" redirectTo="/mockups/new" />
                </div>
              </div>
            ) : (
              <>
                {createMutation.isError && (
                  <p className="text-sm text-red-600">{t("dashboard.standaloneMockup.errorGeneric")}</p>
                )}
                <button
                  type="button"
                  disabled={!canExecute || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                  className="flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition hover:opacity-90 disabled:opacity-50"
                >
                  {createMutation.isPending && <Spinner />}
                  {createMutation.isPending
                    ? t("dashboard.standaloneMockup.generating")
                    : t("dashboard.standaloneMockup.executeButton")}
                </button>
              </>
            )}
          </section>
        )}

        {step === "result" && result && (
          <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 text-center">
            <h2 className="text-lg font-semibold">{t("dashboard.standaloneMockup.resultTitle")}</h2>
            {result.resultImageUrl && (
              <button
                type="button"
                onClick={() => setPreviewResultUrl(result.resultImageUrl)}
                className="overflow-hidden rounded-2xl border border-line shadow-soft transition hover:opacity-90"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.resultImageUrl}
                  alt={
                    selectedTemplate
                      ? t(mockupTemplateTitleKey(selectedTemplate.slug, MOCKUP_CATEGORY_LABEL_KEYS[selectedTemplate.category]))
                      : ""
                  }
                  className="w-full max-w-md object-contain"
                />
              </button>
            )}
            <div className="flex flex-wrap justify-center gap-2">
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
              {/* 게스트는 계정이 없어 "내 작업물"이 존재하지 않는다(과거
                  이미지 탭을 숨긴 것과 동일한 이유). */}
              {user && (
                <Link
                  href="/my-work"
                  className="rounded-full border border-line px-5 py-2.5 text-sm transition hover:border-ink"
                >
                  {t("dashboard.standaloneMockup.viewMyWork")}
                </Link>
              )}
            </div>
          </section>
        )}
      </main>

      {previewBackgroundUrl && selectedTemplate && (
        <ImageLightbox
          src={previewBackgroundUrl}
          alt={t(mockupTemplateTitleKey(selectedTemplate.slug, MOCKUP_CATEGORY_LABEL_KEYS[selectedTemplate.category]))}
          onClose={() => setPreviewBackgroundUrl(null)}
        />
      )}

      {previewResultUrl && (
        <ImageLightbox
          src={previewResultUrl}
          alt={
            selectedTemplate
              ? t(mockupTemplateTitleKey(selectedTemplate.slug, MOCKUP_CATEGORY_LABEL_KEYS[selectedTemplate.category]))
              : ""
          }
          onClose={() => setPreviewResultUrl(null)}
        />
      )}
    </div>
  );
}
