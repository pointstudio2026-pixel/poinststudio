import { z } from "zod";

const landingArticleImageSchema = z.object({
  url: z.string().min(1),
  alt: z.string().min(1),
});

const landingArticleIndustryFitSchema = z.object({
  industry: z.string().min(1),
  reason: z.string().min(1),
});

const landingArticleDetailSpecSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

const landingArticleComboSchema = z.object({
  slug: z.string().min(1),
  label: z.string().min(1),
});

const landingArticleFaqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const landingArticleContentSchema = z.object({
  definition: z.string().min(1),
  images: z.array(landingArticleImageSchema),
  industryFit: z.array(landingArticleIndustryFitSchema),
  detailSpec: z.array(landingArticleDetailSpecSchema),
  combos: z.array(landingArticleComboSchema),
  faq: z.array(landingArticleFaqSchema),
  ctaLabel: z.string().min(1),
  ctaHref: z.string().min(1),
});

export const publishLandingArticleSchema = z.object({
  slug: z.string().min(1).max(160),
  category: z.string().min(1).max(60),
  locale: z.enum(["ko", "en", "ja", "fr", "de"]),
  title: z.string().min(1).max(200),
  displayTitle: z.string().min(1).max(200),
  metaDescription: z.string().min(1).max(300),
  status: z.enum(["draft", "published"]),
  content: landingArticleContentSchema,
});

export type PublishLandingArticleInput = z.infer<typeof publishLandingArticleSchema>;
