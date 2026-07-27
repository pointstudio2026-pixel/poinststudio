"use client";

import { useTranslation } from "@/shared/i18n/LocaleProvider";

/**
 * Real product walkthrough recording (not a mockup) -- Korean UI locale
 * gets the Korean-language recording, every other locale gets the English
 * one (only ko/en variants exist so far, mirroring planPricing.ts's
 * "ko vs. everything else" split).
 */
export function HeroDemoVideo() {
  const { locale } = useTranslation();
  const src = locale === "ko" ? "/landing/hero/demo-ko.mp4" : "/landing/hero/demo-en.mp4";

  return (
    <video
      key={src}
      className="shadow-soft-lg w-full max-w-xl rounded-3xl border border-line"
      autoPlay
      muted
      loop
      playsInline
      controls
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
