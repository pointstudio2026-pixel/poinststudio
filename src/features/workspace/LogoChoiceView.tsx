"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isBrandingDeliverableType } from "@/modules/projects/domain/deliverableTypes";
import { uploadProjectLogo, projectLogoImageUrl, selectLogoChoice } from "@/services/project-logo-service";
import { getNextStep } from "@/features/workspace/stepRoutes";
import { Spinner } from "@/components/Spinner";
import { useTranslation } from "@/shared/i18n/LocaleProvider";

export function LogoChoiceView({
  projectId,
  deliverableType,
}: {
  projectId: string;
  deliverableType: string | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [submitting, setSubmitting] = useState<"upload" | "skip" | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 2026-07-25: 이 단계는 브랜딩 & 로고 외 유형에만 의미가 있다(브랜딩 &
  // 로고는 별도 "로고 스타일" 단계로 로고의 구조적 형태를 정한다). 워크스페이스
  // 단계 목록/사이드바에서는 이미 숨겨지지만, 직접 URL로 들어오는 경우를
  // 대비해 여기서도 명시적으로 막는다(MockupStudioView와 동일 패턴).
  if (isBrandingDeliverableType(deliverableType)) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
        {t("logoChoice.notNeeded")}
      </div>
    );
  }

  async function handleFile(file: File) {
    setUploadError(null);
    setIsUploading(true);
    try {
      await uploadProjectLogo(projectId, file);
      setUploaded(true);
      setPreviewNonce((n) => n + 1);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t("logoChoice.uploadFailed"));
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  async function handleChoice(choice: "upload" | "skip") {
    setSubmitError(null);
    setSubmitting(choice);
    try {
      await selectLogoChoice(projectId, choice);
      const next = getNextStep("logo_choice", deliverableType);
      if (next) {
        router.push(`/projects/${projectId}/${next.route}`);
        router.refresh();
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("logoChoice.submitFailed"));
      setSubmitting(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-xl font-semibold">{t("logoChoice.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("logoChoice.subtitle")}</p>
      </header>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-soft">
          <div>
            <h2 className="text-base font-semibold">{t("logoChoice.uploadCardTitle")}</h2>
            <p className="mt-1 text-sm text-muted">{t("logoChoice.uploadCardBody")}</p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-6 text-center transition ${
              isDragging ? "border-ink bg-surface" : "border-line"
            }`}
          >
            {uploaded ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={previewNonce}
                src={projectLogoImageUrl(projectId)}
                alt={t("logoChoice.uploadedPreviewAlt")}
                className="h-24 w-24 object-contain"
              />
            ) : isUploading ? (
              <Spinner />
            ) : (
              <>
                <p className="text-sm text-ink">{t("logoChoice.dropzoneLabel")}</p>
                <p className="text-xs text-muted">{t("logoChoice.dropzoneHint")}</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}

          <button
            type="button"
            onClick={() => handleChoice("upload")}
            disabled={!uploaded || submitting !== null}
            className="mt-auto flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper transition hover:opacity-90 disabled:opacity-40"
          >
            {submitting === "upload" && <Spinner />}
            {t("logoChoice.confirmUpload")}
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-soft">
          <div>
            <h2 className="text-base font-semibold">{t("logoChoice.skipCardTitle")}</h2>
            <p className="mt-1 text-sm text-muted">{t("logoChoice.skipCardBody")}</p>
          </div>
          <button
            type="button"
            onClick={() => handleChoice("skip")}
            disabled={submitting !== null}
            className="mt-auto flex items-center justify-center gap-2 rounded-full border border-line px-4 py-2 text-sm transition hover:border-ink disabled:opacity-40"
          >
            {submitting === "skip" && <Spinner />}
            {t("logoChoice.skipButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
